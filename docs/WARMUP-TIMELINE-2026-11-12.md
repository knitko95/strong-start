# Warm-up timeline — November 12, 2026

The owner approved the local warm-up mockup for the test app and requested continuous cardio after one start, matching the approved cool-down behavior. Production publication is not approved.

## Behavior

- Warm-up and cool-down reuse the same grouped timeline/card renderer. Warm-up groups are Cardio and Warm-up moves. Each cardio part is visible and independently tappable; move stops use concise names with full accessible labels.
- Compact progress segments count all displayed steps. Warm-up headings identify the cardio part or move number; the full current activity appears above the card. Timer headings use Ready / Time left / Paused, and rep moves retain At your pace and Done.
- One Ready tap starts warm-up cardio. Natural expiry and taps between running cardio parts retain the running state. Deadlines account for elapsed background time across parts, stopping at the next manual move or effort prompt.
- Navigation to another move, How to, list view and reload preserve paused checkpoints. Selecting another part of paused cardio keeps it paused. Existing drafts use the same item/part indexes and checkpoint keys.
- Individual timed warm-up moves still wait for Ready. Rep targets remain read-only. Cardio effort feedback, warm-up completion, the transition to working sets and separate lighter lifting preparation remain available.

No exercise catalogue, planned duration, working-set/progression, schema, storage-key, database, Auth or configuration changes are required.

## Checks

- Development build passes syntax, environment and exercise-guide checks.
- 97 workout/persistence scenarios pass, including new warm-up continuous navigation, pause/reload and background-expiry tests.
- `scripts/test-warmup-timeline.cjs`: six synthetic browser journeys across 1280/390/320 px and light/dark, covering 42 cardio/timed/rep layouts. Checks include real fonts, timer text fit, visible primary controls, centered selection and no horizontal overflow or console/page errors.
- Journeys cover a single Ready start, automatic expiry, direct part selection, How to, pause/resume, cross-group navigation, reload/list recovery, finishing cardio before manual moves, read-only reps, working-set preservation, lighter lifting preparation, walk/jog/bike cardio, effort feedback, skipped cardio and coach guards.
- Existing cool-down browser suite passes all six journeys and 54 layouts with the shared renderer.
- Real rendered phone screenshots inspected. Physical phones, actual device suspension and authenticated real-account flows remain unverified.

Runtime commit `9265ba72974b095f88c1bf31ae623ea20d278bc6` deployed successfully to dev through Workers Build `2fe0c6d4-9e51-43e4-b913-1979c477cd9c`. Hosted entry checks at 1280/390/320 px confirm exact tested HTML, the Testing banner, development backend and no browser errors. All six hosted warm-up journeys / 42 layouts and six hosted cooldown journeys / 54 layouts pass without console or page errors. Production was not changed.
