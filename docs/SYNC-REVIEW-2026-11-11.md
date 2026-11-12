# Cross-device and coach-save verification — November 11, 2026

## Scope

Development candidate based on `c029b09`. The current request authorizes implementation, the development database migration, and the hosted dev test deployment. It does not authorize a production release. Other chats were checked first: the remaining set-count/order/weight fixes and mobile-layout work were separate, and their current dev commits were preserved.

## Result

- Saves use a server revision and a single transaction for plan/settings, history, deletion records, profile name, and eligible coach acknowledgements.
- Conflicting plans/progression/settings/drafts are retained for an explicit choice. Independent workout entries merge; conflicting versions of the same workout require a choice. Client clocks do not select a winning version.
- Deleted workout IDs cannot be reused by stale clients. Unfinished effort remains recoverable; explicit backup restore imports new identities.
- Coach updates wait for active/paused drafts and unsaved member changes. Applying and acknowledging are atomic. Failure rolls both back, and a lost response is recoverable without applying a coach update twice.
- The local envelope retains the shared baseline and latest conflict recovery copy. Existing data and personal backups remain compatible. Storage key and state version are unchanged.

## Checks

- `node scripts/build-dev.mjs`: inline JavaScript syntax, environment isolation, and **36 synthetic persistence/workout/sync scenarios** passed.
- `node scripts/test-sync-browser.cjs`: the built app passed at 1280, 390, and 320 pixels. Checked conflict choice/recovery, paused-draft coach deferral, retry after a lost commit response, and failed-upload recovery. No captured JavaScript/console errors or horizontal overflow in the conflict flow. These browser RPCs use synthetic simulation, not real member data.
- `scripts/test-sync.sql`: executed against **strong-start-dev**, ref `gvyfgqhgqnfmtoytqpeo`. Assertions passed for revision checks, stale writer rejection, atomic coach save/acknowledgement, rollback after an invalid log date, retry idempotence, deletion protection, direct-write/pre-acknowledgement denial, cross-account isolation, unapproved/disabled accounts, and anonymous callers. Synthetic fixture rows were rolled back; no staff memberships were granted.
- Hosted dev: the served HTML matched the tested build, and the same synthetic browser flows passed at 1280/390/320 pixels. The real sign-in page showed the Testing banner, Google sign-in, only development-backend requests, and no captured errors. Cloudflare reported a successful exact-commit deployment.
- Inspected development columns, policies, table and column grants, and functions before migration. Security advisor review after migration showed the two existing hidden-role-table notices, leaked-password protection notice, and ten authenticated-callable definer functions (nine existing, one new).
- The new `commit_account_snapshot` definer function intentionally owns the writes after direct table mutations are revoked. It accepts no target user ID, uses trusted `auth.uid()`, checks approval after locking the caller's profile, uses an empty search path, and is unavailable to anonymous callers. Its advisory is reviewed, not suppressed. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Migration and release

`supabase/migrations/20261111184231_atomic_account_sync.sql` is applied to development only. The filename matches the version recorded by the connected migration tool. It adds `app_state.revision`, `workout_log_deletions`, and read/commit RPCs; restricts direct state/history writes and direct coach acknowledgements; and restricts coach inserts to their supported columns. Existing read policies and staff memberships are unchanged.

Production requires explicit approval of this defined change set and migration. Apply the migration and publish the matching frontend in a coordinated release window. Existing open tabs/Home Screen sessions need to reload: old clients keep their local copy but their direct cloud writes are intentionally denied. A frontend-only rollback to the previous save code is incompatible. A rollback needs its own tested and approved migration/client plan; do not silently restore broad grants.

The existing unrelated pending dev changes are not automatically approved by approving this sync change. Recheck production and dev heads before preparing a release.

## Limits

No production database/configuration changes or main-branch release were made. Physical-phone lifecycle/background testing and an authenticated two-device hosted OAuth test were not performed. The deterministic browser/VM tests exercise concurrency and failure paths; the real database transaction tests exercise revision, atomicity, and permission boundaries. These are complementary checks, not a claim of exhaustive concurrency or security certification.

Plans are resolved as a whole document, not automatically merged field by field. Users may see a conflict on first upgrade when older substantive local and account copies differ. Only the latest resolved conflict recovery is retained locally; copy it before resolving another conflict, switching accounts, or signing out. Deletions made before this migration cannot be reconstructed from missing historical rows. Offline startup caching remains separate work.
