# Today screen states — November 12, 2026

The owner approved the four Today mockups and requested implementation on the test app. This candidate starts from current dev `6227fa7`; current main has no commits missing from that development base. Unrelated local work is preserved in the shared checkout; this change is built in an isolated checkout.

## Behavior

- The collapsed exercise disclosure includes the count of its actual adapted exercises, or the frozen draft exercises while paused.
- A draft takes priority. Its existing completion calculation supplies completed/planned sets and the progress bar. The Next line describes the saved warm-up, cool-down, rest/exercise or next station; a saved partial uses the first unfinished exercise, matching Resume remaining sets. Rendering does not move its cursor.
- Without a draft, the latest completed workout from the current program and local calendar day supplies a saved recap. Actual completion timestamps take precedence over an older partial history date; legacy logs use their date. Partial logs do not produce the recap. View next workout opens the existing preview and leaves the choice to start there.
- Fixed-schedule days without a scheduled workout, draft or completion show A day to recharge and the next planned date. Train today retains the existing start flow. Flexible schedules keep Any day and omit the rest-day card.
- Unread coach messages precede Other workouts. Existing message-open and dismiss-as-read actions remain; coach accounts still omit member-facing messages. Coach preview remains read-only.

Existing rings, schedule/sequence rules, exercise controls and reminders remain. No migration, saved-data schema, database, Auth, permission or hosting configuration change is needed. The work is authorized for development only.

## Verification

- `node scripts/build-dev.mjs`: syntax/environment isolation, 100 persistence/workout scenarios, six offline scenarios and media lifecycle checks pass.
- `node scripts/test-today-workout.cjs`: six browser journeys at 1280/390/320 px in light/dark pass. They cover disclosure/Plan parity, Adjust/Swap, direct start, paused phase and counts, draft preservation, partial completion/resume, finished recap, preview before early extra training, reload, local midnight, fixed/flexible rest days, legacy logs, older partial dates, escaping, unread-message placement and coach restrictions. No console/page errors or backend mutations were captured.
- `node scripts/test-workout-order.cjs`: three browser journeys pass for midweek starts, missed days, cross-week partial resumption, sequence wrapping, reload and coach restrictions.
- Phone screenshots of the completed, paused and rest states were reviewed. `git diff --check` passes.

## Hosted verification

Runtime `25740ad2f5a44d8c5c3cb5d185aad5a10a7dec1f` deployed successfully through Workers Build `c4f2cba8-053f-4c76-8788-d012e46bbce3`. The hosted Today suite verifies the exact built HTML and passes all six desktop/phone/light/dark journeys. The hosted workout-order suite passes all three widths. Read-only hosting checks pass at all three widths for exact public assets, Testing banner, development-only backend/storage/manifest, headers, offline reopening and reconnect. No captured console/page errors or synthetic-flow backend mutations.

These are synthetic browser checks: authenticated real-account flows and physical iPhone/Android behavior remain unverified. Production was not changed.
