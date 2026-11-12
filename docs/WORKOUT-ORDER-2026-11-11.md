# Workout order independent of weekdays — November 11, 2026

Requested scope: implement on the test app only. Starting midweek or missing a planned day must leave workouts in their repeating order. Production publication is not authorized.

## Behavior

- Numbered workouts replace fixed weekday assignments on Today, Plan, initial plan review, preview and Settings order. Planned weekdays remain in Settings/Plan and the next planned attendance date is separate on Today.
- Completing the recommended workout advances to its current successor; the last workout loops to Workout 1. Week boundaries do not reset the recommendation. Extra/out-of-order completions remain in history and weekly progress but do not advance past the expected workout.
- Partial workouts remain resumable without advancing. Completion after a week boundary retains the same history ID/date and counts completion in the actual finish week. Existing weekly deduplication and elapsed-time program/target rules remain.
- Reordering uses the successor in the new order. New programs and explicit restart start at Workout 1. Existing plans, working weights, logs and draft sets remain. Coach preview remains read-only.
- Optional log fields `completedAt`/`orderAdvanced` and optional `block.sequenceResetAt` fit the existing v6 JSON storage/snapshot contract. Legacy complete logs use their date and count as advancing completions; there is no reliable historical record of whether a legacy session was intended as an extra. No database migration, Auth, permission or production configuration change.

## Source baseline and checks

Fetched dev/main before implementation. Local dev matched `555d5788b4dbd1ef04aa384e4316b3e4eb2b8f16`. Main's three divergent policy-release commits are already represented by the corresponding dev policy commits and later corrections; comparison confirmed runtime policies/terms were retained. No older source replacement or main push. Unrelated animation/source-register changes in the working tree are excluded.

Local verification passed:

- `node scripts/build-dev.mjs`: syntax/environment isolation, 56 persistence/workout scenarios and six offline scenarios.
- Added regression cases for cross-week carryover, repeated cycles, all 13 splits, flexible days, partials/extras, legacy logs, completion-date sorting, reload, deletion, reordering, restart and new programs.
- `node scripts/test-workout-order.cjs`: real headless Chrome at 1280/390/320 px, with the clock set to a Wednesday. Clicked preview/Start; completed Workout 1; partially saved Workout 2 Friday; skipped Monday; reloaded Wednesday in program week 2; resumed/finished the same log; completed Workout 3 and looped to Workout 1. Checked separate weekly completion, Settings/Plan labels, schedule/flexible changes, no horizontal overflow, coach read-only state, no unexpected console errors and no backend mutations.
- Existing workout layout suite passed 228 layouts with no console errors. Inspected the 320 px screenshot. `git diff --check` passed. Service-worker shell version advanced for offline updates.

## Hosted verification — November 12, 2026

Runtime commit `622b496d55cf62ae3a6ac4b1580cf2bba710d22a` deployed successfully from dev through Cloudflare build `8a988e8c-b74c-4384-b42a-cda0cc763921`. The hosted workout-order suite passed the same full flow at 1280/390/320 px against exact candidate HTML, with synthetic local state, no backend mutations and no unexpected console errors. Hosted Workers checks also passed at all three widths: exact public assets, test-only backend routing, Testing banner/storage/manifest isolation, offline reopening and reconnect.

Physical phones and authenticated real-account/two-device behavior are not verified by synthetic browser data. No account or workout data was copied from production. There are no pending database migrations or configuration changes. No main/production publication was performed or approved.
