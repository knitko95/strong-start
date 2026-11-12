# Full development release candidate — November 11, 2026

Prepared at the owner's request to get all current development changes ready for publication, including the database changes. **Approved and published November 11, 2026.** The preparation record below describes the pre-release state; the publication results follow.

## Publication result

The owner explicitly approved candidate `4f9bd960966a8f02d92557f7aac5cbed066d0708` and its six production migrations. All six exact SQL files were applied in order to production `aybtxqsneywuqxzjwoek`. [PR #1](https://github.com/knitko95/strong-start/pull/1) merged as `d9b8ff309205e4fbfccf23e1029f05c7dca3e47b`; [GitHub Pages succeeded for that SHA](https://github.com/knitko95/strong-start/actions/runs/43128415693). Live HTML, privacy page, offline scripts and manifest matched the release commit, allowing only newline normalization. Runtime source files were unchanged from the approved candidate.

Production and development now match in table RLS flags, columns, constraints, triggers, policies, table/column grants, function definitions/execute grants and message-table publication. Function definitions were compared after normalizing line endings. Production aggregate checks confirmed no eligible legacy messages or plan notes were missing from the migration import. Security advisors match the tested development candidate: the restricted-role-table notices, twelve reviewed authenticated definer RPCs and existing disabled leaked-password-protection warning remain.

All six browser suites passed against the live page using synthetic account/RPC/Realtime interception, including 228 workout layouts. Only the temporary test copies were adapted for production routing and the absent Testing banner; no app changes were needed. Real unauthenticated sign-in checks passed at 1280/390/320 px with Google entry, production backend/storage keys, no Testing banner, no horizontal overflow and no captured errors. No real account was signed in, messaged or deleted as a production test. Physical-device, real two-device and authenticated production-flow limits remain as described below. Existing sessions should reload without clearing browser data.

Automatic approval review initially rejected the messaging migration's SELECT policy. Fresh development role tests and catalog inspection demonstrated the nested thread RLS participant restriction; the unchanged migration then passed review and applied. A separate migration-history ID repair was rejected as outside the approved six schema migrations. It was not executed. The connected tool assigned the following production history IDs; SQL hashes match the corresponding approved repository files after line-ending normalization:

| Repository migration version | Production history version | Name |
|---|---|---|
| `20261111184231` | `20261112003240` | `atomic_account_sync` |
| `20261111195538` | `20261112003321` | `self_service_account_deletion` |
| `20261111201943` | `20261112003522` | `coach_messaging_threads` |
| `20261111202328` | `20261112003526` | `coach_message_read_cursors` |
| `20261111202645` | `20261112003529` | `coach_message_thread_status` |
| `20261111212921` | `20261112003533` | `live_coach_messages_and_receipts` |

All thirteen migrations are applied; do not infer pending schema work from this version-ID difference or replay the six files. Aligning only those six history version fields with the repository IDs remains pending separate authorization. Any repair must assert the current version, name and exact SQL hash and preserve the statements and seven baseline entries. This bookkeeping difference does not prevent the running app from using the completed schema.

## Pre-release preparation record

## Defined candidate

Application candidate: `886be9405809e51f73cb17ea8a00d766aee97742` on `dev`, plus the documentation-only commit containing this record and feedback item #32. Production baseline: `d88f49783e29c04fd8aaaf26551ab654d2a768de` on `main`. After fetching, the application candidate contained all 49 commits ahead of main; main had no unique commits. The checkout was clean and dev was pulled with `--ff-only` before verification.

This release includes all implemented changes in that comparison: isolated testing infrastructure; unit conversion and saved-data migration; recoverable partial workouts and consistent completion/order/weight entry; revision-checked account sync and atomic coach plan delivery; offline reopening, accessible dialogs and shorter setup; timer sound recovery; self-service account deletion; private coach conversations, live updates and Sent/Read receipts; setup/Settings preservation; exercise-library instructions and pain warnings; muscle-map improvements; the shared workout design and superset explanations; phone safe-area and message-keyboard positioning; and the connected-browser offline-notice fix. Existing beta access and staff provisioning rules remain in force. Items only discussed, mocked up, or awaiting recovery from earlier work are not part of the source candidate.

Review the [complete application comparison](https://github.com/knitko95/strong-start/compare/d88f49783e29c04fd8aaaf26551ab654d2a768de...886be9405809e51f73cb17ea8a00d766aee97742) and [test app](https://strong-start-dev.pages.dev/). Cloudflare [successfully deployed the exact application SHA](https://github.com/knitko95/strong-start/runs/130852402427). Hosted HTML matched the isolated local build exactly, allowing only newline normalization.

## Database state and promotion order

Connected projects were freshly verified healthy in `us-east-2`: development `gvyfgqhgqnfmtoytqpeo`, production `aybtxqsneywuqxzjwoek`. Production has the seven original migrations. Development has those seven plus all six files below. **No migration remains to apply to development; all six remain pending in production.** Do not replay the seven recovered baseline files, including the intentionally omitted historical account-specific owner assignment.

After approval, recheck the branch heads and production history, then apply only these reviewed files to production in this order, followed immediately by publication of the matching frontend:

1. [20261111184231_atomic_account_sync.sql](../supabase/migrations/20261111184231_atomic_account_sync.sql)
2. [20261111195538_self_service_account_deletion.sql](../supabase/migrations/20261111195538_self_service_account_deletion.sql)
3. [20261111201943_coach_messaging_threads.sql](../supabase/migrations/20261111201943_coach_messaging_threads.sql)
4. [20261111202328_coach_message_read_cursors.sql](../supabase/migrations/20261111202328_coach_message_read_cursors.sql)
5. [20261111202645_coach_message_thread_status.sql](../supabase/migrations/20261111202645_coach_message_thread_status.sql)
6. [20261111212921_live_coach_messages_and_receipts.sql](../supabase/migrations/20261111212921_live_coach_messages_and_receipts.sql)

The schema comparison found the expected three new tables, twenty columns, six functions, three policies, restricted direct-write grants, three revised feedback policies, and message-table Realtime publication. Existing function definitions/execute grants and existing column definitions matched. Table and column grants were inspected separately. Production read-only aggregate checks found no legacy coaching messages incompatible with the new message constraint and confirmed the Realtime publication exists. Legacy assigned-coach history/plan notes are imported by the reviewed migration, not copied from development.

No additional production Auth settings, Google client changes, staff assignments, or test-data copying are required by these migrations. Keep the production origin/redirect settings and credentials. Development users and workouts must remain separate.

## Verification repeated for this candidate

- `node scripts/build-dev.mjs`: inline syntax and environment isolation; all 49 persistence/workout/sync/onboarding scenarios and five offline-worker scenarios passed.
- All six committed browser suites passed against the hosted exact build: sync, account deletion, coach messaging including simulated keyboard geometry, setup/Settings, muscle map, and workout layout. Checks include desktop and 390/320 px phone widths; workout coverage includes 228 light/dark, portrait/landscape and simulated-safe-area layouts, with no fitting-screen overflow or captured errors.
- Real hosted sign-in page, without synthetic RPC interception: Google entry, Testing banner, development backend only, no horizontal overflow and no captured console/page errors at 1280/390/320 px. No login or account mutation was performed by this check. Isolation headers were present.
- `scripts/test-sync.sql`, `scripts/test-account-deletion.sql`, and `scripts/test-coach-messaging.sql` all passed again on development. Tests exercise real PostgreSQL roles, caller isolation, rejected stale/direct writes, atomic saves and coach acknowledgement, deletion/session/retention boundaries, messaging read/reply/receipt distinctions, retries and disable/reassign/delete. Synthetic fixtures and temporary test roles were rolled back. Never run these fixture suites on production.
- Security advisors reviewed on both projects. Development has the two intentionally policy-free restricted role-table info notices, twelve intentionally authenticated-callable SECURITY DEFINER RPC notices, and the existing disabled leaked-password-protection warning. Production has the corresponding baseline notices with nine such RPCs. These are recorded limitations; this release does not broaden role-table access or change Auth configuration. See [RPC advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Production HTML still matched `origin/main` exactly, allowing only newline normalization. No production data, schema, Auth/configuration, or branch publication was changed.

Browser feature suites simulate authenticated RPC/Realtime transport; the independent SQL suites exercise actual database behavior. This run does not establish a fresh Google sign-in, a real two-device WebSocket exchange, physical iPhone keyboard/Home Screen behavior, background/locked-screen timers, or assistive-technology compatibility. Earlier verification records and owner reports remain separate evidence, not substitutes for these missing checks.

## Coordinated release and recovery

Existing open browser tabs and Home Screen sessions must reload after publication. Old clients keep local data but the atomic-sync migration intentionally denies their old direct writes, and the messaging migration stops the old shared-coach-feedback send path. Keep the database/frontend release window short; users may temporarily see sync failures until the matching page is available and refreshed. Do not clear their browser data. The first upgraded sync can require choosing between differing device/account copies; preserve recovery copies before resolving a conflict.

After explicit approval, apply and verify the six migrations against the production ref, merge the approved dev head normally into main, wait for GitHub Pages success for the exact release SHA, compare the live assets with that SHA, and verify production routing and changed flows. Inspect production migration history, catalog/grants/RLS/publication and advisors separately. Authenticated member/coach checks need the intended test session; do not fabricate an end-to-end pass from deployment success. Update the feedback log to Live only for verified publication.

If a migration or publication fails, stop and report exactly which migration versions committed; do not rerun already-applied migrations or revert only the frontend to the old protocol. No tested automatic database rollback is included. A rollback/forward repair needs a compatible, tested and approved plan. See the [sync](SYNC-REVIEW-2026-11-11.md), [account deletion](ACCOUNT-DELETION-2026-11-11.md), [messaging](COACH-MESSAGING-2026-11-11.md), and [live messaging](LIVE-MESSAGING-2026-11-11.md) records for feature-specific limits.
