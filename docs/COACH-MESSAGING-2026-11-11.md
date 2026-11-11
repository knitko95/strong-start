# Coach messaging: November 11, 2026

Item #19 was approved for implementation after review of the revised compact mockups. This candidate is for `dev` and its isolated test database only. Production release still requires approval of the tested change set. Messaging commit: `db32e654474162c22ca4e0f4c4828767be373fbe`, integrated on current dev base `0dd742a`.

## Behavior

- Today shows the assigned coach's card only for unread incoming messages. Opening the thread or dismissing the card marks earlier messages read without deleting them. Settings always provides the coach entry.
- Conversations open as an accessible overlay over the current screen. Bottom tabs hide; closing restores the opener or a nearby heading. Workout state/timers are not paused by messaging. The composer grows from one line; tags are optional. App feedback remains separate and owner-only.
- The coach list separates unread from needs-reply. Reading does not resolve a question. Replying or marking done resolves incoming messages only through the snapshot that was opened; later messages remain pending. Unchanged failed-send retries have a client-generated idempotency ID.
- Messages refresh on foreground/reconnect, on send and explicit Refresh. There are no push notifications or continuous live updates. Unsent text is retained in memory per account/thread until reload/sign-out/account change; there is no durable offline outbox.

## Database and compatibility

Apply these files in order only to the approved target:

1. `20261111201943_coach_messaging_threads.sql`
2. `20261111202328_coach_message_read_cursors.sql`
3. `20261111202645_coach_message_thread_status.sql`

All three are applied to `gvyfgqhgqnfmtoytqpeo` (`strong-start-dev`); none was applied to production by this work. No Auth settings or real staff assignments changed. Synthetic staff memberships in the SQL tests roll back.

`coach_threads` and `coach_messages` have participant-only SELECT policies and no client write grants. The guarded `coach_messaging` RPC derives the sender from Auth and derives the coach from the member's existing `profiles.invited_by` and the trusted coach roster. The app does not infer role/assignment from a supplied email or editable Auth metadata. Both profiles must be active and the member must be approved. App-owner membership alone is insufficient. Reassignment removes access to the former thread rather than sharing its history with a new coach.

Legacy coach-feedback messages with an existing inviting coach are copied once, preserving read/done state and workout context. Assigned-coach plan notes are also copied, initially read so old notes do not produce new badges. A trigger adds new assigned-coach plan notes immediately, once per plan-update ID. Plan application continues through the existing atomic account sync and waits for active/paused drafts. Legacy data without an assignment is retained in its original tables; it is not assigned to an arbitrary coach. Historical data is returned in date order with ID tie-breaks, paginated 50 messages at a time. Reply status covers the whole thread.

Old clients cannot send new coaching feedback to the former shared inbox after the migration. Coordinate approved production migration and frontend publication, and ask open tabs/Home Screen sessions to reload. A frontend-only rollback would restore an incompatible shared-inbox flow; prepare and test a separate rollback instead. No production release is implied by the dev deployment.

Deleting a member cascades both sides of their conversation. The existing retained app-feedback policy is unchanged. Local state schema, workout storage keys, plans, weights, logs and saved workout drafts are unchanged.

## Verification

- `node scripts/build-dev.mjs`: syntax/environment isolation, 45 persistence/workout scenarios and five offline-shell scenarios passed.
- `node scripts/test-coach-messaging.cjs`: real frontend with synthetic sessions/RPCs at 1280, 390 and 320 pixels. Covers read/dismiss, optional tags, growing composer, failed/lost-response retries, no duplicate send, escaped message HTML, retained message draft, workout return, distinct unread/reply state, coach replies and stale cross-account responses. The optional URL argument repeats the same checks against an exact matching hosted build.
- `scripts/test-coach-messaging.sql`: real development PostgreSQL role tests in a rolled-back transaction. Covers anonymous denial, cross-member/cross-coach isolation, direct-write denial, derived sender, idempotency, owner-feedback separation, read-versus-reply status, stale reply/done protection, new plan notes, long-history pagination/status, chronology, disable/reassign/delete and stale-token denial.
- Security advisor review: existing restricted-role-table info notices and disabled leaked-password-protection warning remain. The new authenticated security-definer RPC adds one intentional notice; its explicit grants, empty search path, assignment checks and mutation boundaries were exercised by role tests. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Hosted verification: [Cloudflare Pages check](https://github.com/knitko95/strong-start/runs/130782949561) succeeded for the exact messaging commit. The hosted HTML matched the locally tested isolated build, and the messaging browser suite passed again against `https://strong-start-dev.pages.dev/` at all three widths with no captured page/console errors. The account-deletion browser regression suite also passed locally at those widths after integration.

Browser tests simulate RPC transport; they do not establish a two-person Google sign-in/send/reply exchange through PostgREST. SQL tests separately establish the actual database behavior and roles. Physical iPhone/Android keyboards, Home Screen sessions, screen readers and background/locked-phone timers remain unverified. No real member messages were sent or viewed as test fixtures.
