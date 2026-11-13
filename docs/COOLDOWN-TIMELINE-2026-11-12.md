# Cardio and cool-down timeline — November 12, 2026

The owner approved the final local mockup without the repeated section title, for the test app. The owner also requested starting cardio once and continuing through its parts without repeated Ready/start actions. Production publication is not approved.

## Implemented behavior

- One continuous timeline displays individually tappable cardio parts, the walk, existing recovery moves and stretches. Small group labels provide context; no extra section title or group tabs are added.
- Compact header segments match those steps. The header identifies the group; the full current activity name stays above the card. Running timer headings consistently say Time left; Ready, Paused and side-switch instructions retain their distinct states.
- Start cardio begins the first part immediately. Automatic transitions and taps between parts of the same running cardio keep it running. Elapsed background time advances across expired cardio parts.
- Changing to another move, How to, list view and workout pause preserve paused checkpoints. A paused cardio timer remains paused when selecting another part. The walk and individual timed stretches/recovery moves still wait for Ready.
- Cardio completion/effort feedback, side timers, existing recovery content, finish/logging and coach guards remain. Warm-up retains its existing numbered timeline and part-selection Ready behavior.

No database, Auth, configuration, storage-key or schema-version change is required. Display steps map back to the existing guide item/part indexes; existing drafts and checkpoints remain usable.

## Verification

- Development build passes syntax, environment and exercise-guide checks.
- 95 workout/persistence scenarios pass, including new single-start, continuous part navigation, paused/reload checkpoints, background catch-up and coach guard checks.
- `scripts/test-cooldown-timeline.cjs` verifies exact built HTML and development backend routing. Six browser journeys cover 1280/390/320 px in light/dark, with 54 Ready/running/paused layouts, real fonts, consistent headings, visible primary controls, clock fit and no page overflow or page errors.
- Browser journeys exercise Start cardio, natural expiry, direct part selection, pause, cross-group navigation, reload, cardio completion/effort feedback, manual walk/recovery/stretch starts, side changes, interval parts, skipped optional cardio and coach navigation guards.
- Six offline scenarios and the exercise media lifecycle suite pass. Real rendered phone screenshots inspected.

Hosted deployment verification will be recorded after the dev push. Physical phones, background suspension on actual devices and authenticated real-account flows remain unverified. Synthetic browser state does not establish those behaviors.
