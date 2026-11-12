# Workout spacing and screen coverage — November 11, 2026

## Requested scope

Review the recently implemented workout screens for buttons sitting too low, and identify screens missing from the shared design. Reviewed current dev source based on `038e168`. This change fixes shared viewport sizing; it does not approve or implement another screen redesign.

## Finding and fix

The old `.focus` minimum height was `100dvh - 40px`. The containing document then added the testing banner, main's 16px top padding, bottom padding, and phone safe areas. A fitting 390 × 844 exercise or rest screen had a document height of 874px. With simulated 47px top and 34px bottom safe areas it reached 955px. Auto margins pushed the action row toward the bottom of that oversized child.

Focus mode now gives the document a viewport minimum height and lets its banner, notices, safe areas, and content share that space using flex layout. The workout fills the remainder. The existing 24px bottom clearance and bottom safe-area inset are retained. Content that genuinely needs more room remains in normal document flow and scrolls; there is no fixed action overlay or content clipping.

This applies to workout preview and all existing `.focus` workout screens, including older layouts. Normal pages keep their existing layout. No workout, timer, persistence, database, or access behavior changes.

Follow-up correction: the initial flex rule targeted every direct `.wrap` child, including `#offline-notice`. It overrode that notice's browser-provided hidden display while online and could allocate spare space to the notice. The rule now targets only the explicit `#app-shell` content wrapper. Browser checks reproduce the original false notice, require it hidden on all 228 online layouts, and verify it appears offline without growing as a flex item, then hides on reconnect. Offline caching and sync logic did not change.

## Screen coverage

This table records the initial spacing review. The owner subsequently approved updating all remaining screens, including the superset explanation, on the test app. See [the follow-up implementation and verification](WORKOUT-SCREENS-2026-11-11.md) for their updated status.

All of these existing paths are present. The gaps are in adopting the new design, not absent routes or workout steps.

| Screen | Current presentation |
| --- | --- |
| Working sets and rest | Shared one-card design |
| Lighter warm-up sets | Shared one-card design |
| Guided warm-up/cool-down ready, timed, paused, and rep-based moves | Shared one-card design |
| Workout preview | Existing exercise-list preview; not restyled by #27 |
| Exercise complete / next station | Existing feedback, progression and next-exercise cards; not restyled by #27 |
| Warm-up and cool-down list modes | Existing checklist layouts; not restyled by #27 |
| Optional cardio choice and cardio difficulty question | Existing controls; not restyled by #27 |
| End of guided cool-down | Existing All done / Finish workout screen |
| Saved-workout summary | Existing dialog after saving, including partial-workout handling; not the standalone completion mockup |
| Supersets | Existing paired logging and Then line. The explanatory introduction, pair strip, round labels and explicit A → B → rest transitions from #4 are still awaiting approval in the feedback log |

Keep those design gaps for review. In particular, the separate #4 decision still says not to build its proposed flow yet.

## Checks and limits

- `node scripts/build-dev.mjs`: syntax and environment checks, 45 persistence/workout scenarios, and five offline-worker scenarios passed.
- `node scripts/test-workout-layout.cjs`: 84 layouts across 14 states at 390 × 844, 320 × 568, and 844 × 390, with zero and simulated 34px bottom / 47px top insets. Checks fitting-screen footer clearance, no artificial page scrolling, horizontal fit, and reachable footers on longer screens.
- Also checks wrapping/hidden development banners, the signed-in Feedback header, More dialog opening/Escape, and returning to normal Today navigation. No unexpected captured browser errors.
- Tests use synthetic local state with account/backend requests blocked. The optional hosted URL checks that the hosted HTML matches the exact isolated development build before exercising it.
- Emulation does not prove physical iPhone/Android browser chrome, Home Screen or keyboard behavior. Long screens still need normal scrolling, especially in landscape and with additional notices.

No new database migration or production configuration is required. This fix is for the development site; production publication requires approval of the tested release. Other pending dev changes and migrations are outside this spacing fix's scope.
