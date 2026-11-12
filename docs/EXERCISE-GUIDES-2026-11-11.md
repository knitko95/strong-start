# Exercise media registry and development integration

Owner request: build a registry and connect the five visually reviewed animations to their existing how-to cards on the test app. The bodyweight squat reference remains separate. This work does not approve production publication or the earlier proposal to move the exercise catalogue into the database.

## Data and assets

`exercise-guides/registry.v1.json` maps existing catalogue IDs to versioned animation records, character variants, viewing settings, fallback behaviour and enabled environments. Written instructions remain owned by the catalogue and `exHowTo()`; exercise names/IDs, saved plans, progression and account data are unchanged.

The initial registry has exactly five mappings:

- Dumbbell Romanian Deadlift — version 1.
- Hammer Curl — corrected grip, version 2.
- Standing Dumbbell Shoulder Press — corrected grip, version 2.
- Dumbbell Bench Press — corrected grip, version 2.
- Plank — held pose, version 1.

Only the visually reviewed rose-top character is published in the registry. The alternate character and all squat references remain in local pilot artifacts. There is no catalogue entry named `squat` to which the bodyweight reference can safely be attached. No weighted squat is given a mismatched demonstration.

The animation and character identifiers are separate metadata concepts. Each initial GLB still contains the character, equipment and one movement; this allows future packaging changes without changing exercise links. Each asset has a versioned, SHA-256-derived filename, expected byte count and full hash. Graphical assets retain their upstream CC0 license; the vendored model-viewer 4.4.0 bundle retains its Apache license and bundled notices. Raw review submissions, editable sources and JSON motion samples are not part of the public runtime package.

`node scripts/check-exercise-guides.mjs` checks catalogue identity, review status, environment flags, safe paths, hashes/versions, self-contained GLB structure and the five-asset initial scope. Both public build scripts validate and copy `exercise-guides/`.

## Runtime behaviour

The library, preview and workout how-to entry points share `exInfo()`. It leaves the existing steps, equipment, warnings, prescribed sets and muscle diagrams in place and asks the isolated guide component to mount a demo. The component reads the registry, then imports the viewer and requests the selected GLB only for an enabled mapping. The initial enabled environment is development only. Production metadata gating is tested without touching the live site.

The viewer supports mouse/touch rotation during playback, scroll/pinch zoom, pause, half speed, front/side/back and reset. Side faces right. Floor-exercise framing adapts at narrow widths. Reduced-motion preference starts paused; backgrounding pauses playback. The component never reads or writes account/workout storage or calls save/cloud functions. Coach preview remains read-only.

Replacing or closing a dialog disposes the active viewer, pauses animation, removes visibility/event listeners and invalidates late loads. A detached-mount observer provides a second cleanup path. Widget clicks do not bubble to the modal scrim's delegated close action. Existing modal Escape, focus restoration and background inertness remain in use.

Registry/viewer/model failure preserves the written guide. Offline visits show the written fallback without attempting a heavy 3D download. The service worker includes only the small guide loader, CSS and registry in its shell allowlist. Models and the viewer bundle are not automatically precached; 3D offline availability is not promised. No active workout is forcibly refreshed for the new service-worker version.

## Verification

Local development build passed its syntax/environment checks, 49 persistence/workout scenarios and six offline scenarios. The guide integration browser suite covers all five real library-row entry points at 1280, 390 and 320 px, correct assets, mouse/CDP-touch rotation, playback/pause/half speed, side view, cleanup, state/draft preservation, coach preview, reduced motion, offline and failed-model text fallback, and closing during a delayed model request. No unexpected console errors or backend mutations occurred in the successful synthetic-session checks.

The previously reviewed exported motion data also passed loop/contact constraints, exact motion transfer between the compatible rigs, and corrected dumbbell orientation checks. These do not establish physical-phone performance or professional technique certification.

## Hosted development verification

Runtime candidate `fc2d060d13ad128206d7ee093146b5debeb90a37` was pushed to `dev` and deployed by successful Workers Build `ca19f7ed-8945-43a3-8111-f38d6ffbb465` at `https://dev.strongstart.app/` (November 11 Eastern time). The connected repository account's push permission was rechecked before deployment. Current main/dev public app/policy sources were compared before implementation; their relevant content already matched despite different promotion commit hashes.

The full guide suite passed on that hosted runtime at 1280, 390 and 320 px: five library-row how-tos, correct assets, mouse/CDP touch rotation during playback, pause/half speed/views, member state and draft preservation, coach preview, reduced motion, offline and corrupt-model text fallback, and close during a delayed model request. No unexpected console errors or backend mutations occurred. These are isolated synthetic member sessions, not authenticated account or real-workout tests.

The hosted Worker suite also passed exact public shell assets, dev-only backend/keys/storage/manifest/banner, normal DNS/TLS, offline reopening and reconnect at all three widths. Production was not changed. A documentation-only follow-up records these results; runtime files/assets are unchanged from the tested candidate.

Pending database migrations and production configuration changes: none. Physical-device rendering/touch/performance and exercise technique remain review limits. Production publication still requires a separately defined and approved release; this initial registry enables development only.

## November 12 extension

The owner visually accepted six further rose-top animations and requested their how-to integration on the test app. The registry now contains eleven mappings; the original five remain unchanged and the separate bodyweight squat remains excluded. See [the six-exercise review, corrected grips, level handles and integration record](EXERCISE-ANIMATION-BATCH2-2026-11-11.md). This extension does not approve a production release.
