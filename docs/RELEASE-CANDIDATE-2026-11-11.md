# Full development release candidate — November 11, 2026

Prepared at the owner's request to get all current development changes ready for publication, including the database changes. **Awaiting explicit release approval.** Production has not been changed.

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
