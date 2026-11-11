# Live messages and Sent/Read receipts: November 11, 2026

The owner approved live updates and Sent/Read receipts and explicitly confirmed that dismissing the Today card must also mark its messages read. This is a dev-only candidate; production publication and database changes still require approval of the tested release.

## Changes

- Incoming messages, unread counts and coach reply status refresh automatically while the app is visible. The latest outgoing message shows Sent after confirmed saving and Read after the recipient opens/marks the conversation read. Dismiss keeps its existing mark-read behavior. No Delivered status, typing indicator or phone notifications were added.
- Foreground Postgres Changes INSERT/UPDATE subscriptions use the existing participant SELECT policies. Events are refresh signals; authorized RPC data remains authoritative. The subscription is stopped on background/pagehide/account reset and restored on return, with channel-error retries and a 15-second foreground fallback poll.
- Quiet thread updates keep the composer DOM node and its draft/focus/caret. Readers at the bottom follow arrivals. Readers in older history keep their position and get New messages; peek does not issue a receipt. Returning to the bottom acknowledges the incoming messages. Catch-up retrieves missing pages after an outage.
- Repeated reads do not rewrite already-set timestamps, preventing event loops. Read status and Needs reply remain separate. Account-generation and request-version checks reject obsolete responses. Existing save/workout and idempotent-send behavior is retained.

## Migration and release

`20261111212921_live_coach_messages_and_receipts.sql` was applied only to `strong-start-dev` (`gvyfgqhgqnfmtoytqpeo`). It publishes the existing message table and replaces the guarded RPC to return read timestamps/client IDs, support non-acknowledging peek and avoid redundant updates. Participant RLS and authenticated SELECT-only grants are unchanged; anonymous clients still cannot read messages. No users, coach roles, assignments or Auth settings were changed.

An approved production release must first include the earlier coaching migrations and then this migration, followed by the matching frontend. Production remains unchanged by this work. Clients without this new migration retain manual messaging but cannot use the peek operation or display reliable receipts; this frontend should be deployed with its matching database migration.

## Verification and limits

- The isolated dev build passed syntax/environment isolation, 45 persistence/workout checks and five offline-shell checks.
- The messaging browser suite at 1280, 390 and 320 pixels covers live arrivals, Sent to Read changes, retained composer node/text/caret, no scroll jump while reading history, delayed acknowledgement through New messages, reconnect catch-up, no repeated-read event loop, hidden-page unsubscribe and resumed updates. Earlier send/retry, role UI, account isolation and workout-return scenarios remain included.
- Development PostgreSQL tests run with synthetic fixtures and staff roles in a rolled-back transaction. They cover unread/read/reply separation, timestamp visibility to the sender, peek without acknowledgement, dismiss with a receipt, no-op read stability, private participant access, stale retries, pagination and account disable/reassign/delete. Publication/RLS/grants were independently inspected.
- Security advisor output is unchanged from the preceding messaging release: two deliberately hidden role-table info notices, twelve intentional authenticated definer-RPC notices, and the existing disabled leaked-password-protection warning. No new RPC or broader client grants were added. [Advisor documentation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Browser tests simulate authenticated transport and Realtime event callbacks; SQL tests exercise actual development database roles. They do not prove a real two-device authenticated WebSocket exchange, mobile keyboard/Home Screen behavior or background delivery. Physical-device and two-person live-update testing remains a follow-up for the test app. No production mutations or real-person test messages were made.

## iOS Home Screen keyboard correction

The owner reported that messaging appeared to work but the reply area sat too high and showed the menu underneath when typing in the iOS Home Screen app. The correction keeps the backdrop full-size, measures its actual position before placing the sheet in the visual viewport, freezes/restores the underlying page, removes the app tabs from layout while messaging, and replaces the Home indicator inset with a small bottom padding while the keyboard is open. It does not change message content, permissions, receipts or workout data. No new database migration or production configuration change is required.

`scripts/check-message-keyboard.cjs`, called by the messaging browser suite, simulates keyboard heights, positive visual-viewport offsets, a displaced fixed backdrop, safe-area padding and multiline input at desktop, 390 and 320 pixel widths. Assertions cover sheet/composer bounds, hidden menu, retained input focus and restored body styles/page scroll after closing. These are regression checks for the positioning calculation and do not reproduce the native iOS keyboard or establish a physical-device fix. The owner should retest in the Home Screen app after the dev update.
