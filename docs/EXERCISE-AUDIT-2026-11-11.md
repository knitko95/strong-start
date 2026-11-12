# Exercise content audit: November 11, 2026

The owner requested checking the existing exercises against NASM, keeping Strong Start's own wording and correcting inaccuracies. This is a reference audit by a coding agent, not professional technique certification, medical review, or NASM endorsement. No NASM instructions, photographs, videos or diagrams were imported into the app.

## Scope and coverage

Screened the 320 `LIB_RAW` entries, shared `exHowTo()` instructions, 92 `MOVE_HOW` warm-up/stretch entries and `gHowTo()` fallbacks in development source `8c30d8e`. Fetched both remote branches first; local dev matched current origin/dev. Main's relevant runtime/policy content was already present on dev; its differing promotion commits did not require replacing or merging runtime files. Preserved the unrelated untracked `output/` directory.

The [entry-by-entry inventory](exercise-audit-2026-11-11.json) records source URLs, reference coverage, individual findings and changed fields. These are **coverage categories, not pass marks**:

The [ongoing source register](EXERCISE-SOURCES.md) makes these exercise-to-source associations browsable and retains this dated audit when later reviews add NASM or other credible sources. The register is documentation only; it is not displayed in the app.

| Reference coverage | Catalog | Warm-up/stretch how-tos |
| --- | ---: | ---: |
| Same movement described by an inspected NASM page/article | 33 | 8 |
| Related movement or general principle only | 244 | 24 |
| No suitable comparison in the inspected sources | 43 | 60 |

Related guidance does not verify the equipment setup, grip, range, suitability, or anatomy of every variation. An unresolved entry is not established to be incorrect. Even a same-movement reference can contain errors; see the source conflicts below. The audit does not establish that every remaining instruction is accurate.

## Corrections made

Six catalog cues changed. Names, IDs, equipment requirements, muscle data, movement-plane tags, logging modes, saved-data schema and programming rules are unchanged.

| Entry | Finding and correction | Evidence |
| --- | --- | --- |
| Leg Press | The depth cue waited until the hips began tucking. It now stops while pelvis/back remain supported and avoids snapping the knees straight. | [Leg Press](https://www.nasm.org/resource-center/exercise-library/leg-press) |
| Dumbbell Romanian Deadlift | The cue only described the dumbbells sliding down the thighs. Added the missing hip hinge and a depth limit based on maintaining back position. | [Dumbbell RDL](https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift) |
| Plank | Replaced an automatic suggestion to add a plate, which this timed entry does not log, with elbow support and trunk alignment. Weighted planks are not declared inherently incorrect. | [Plank](https://www.nasm.org/resource-center/exercise-library/plank) |
| Side Plank | Replaced pushing hips forward with shoulder support and a straight, non-rotating body position. | [Side Plank](https://www.nasm.org/resource-center/exercise-library/side-plank) |
| Stability Ball Rollout | Clarified stopping before loss of trunk control instead of rolling until hips want to sag. | [Core training](https://www.nasm.org/resource-center/blog/training/core-training-programming) |
| Band Good Morning | Changed contact from behind the neck to across the upper back, and clarified the hinge. Exact band setup remains a review limit. | Related [Good Morning](https://www.nasm.org/resource-center/exercise-library/good-mornings) guidance |

The shared instruction corrections address observable contradictions in the app:

- Timed moving exercises (ropes, sleds, body saws, circles, hops and carries) no longer say to hold still. Static planks/holds keep their hold instruction.
- Timed unilateral holds say to complete the interval on each side instead of counting reps.
- Alternating skater/lateral bounds no longer receive a conflicting instruction to finish one side first.
- Medicine-ball power movements no longer receive jump-landing instructions. Jumps retain landing guidance. [Power examples](https://www.nasm.org/certified-personal-trainer/the-opt-model), [Box Jumps](https://www.nasm.org/resource-center/exercise-library/box-jumps).
- Removed the blanket two-second descent prescription. Ballistic lifts get an appropriate quick-effort/reset cue; carries get continuous breathing/set-down guidance. [Kettlebell training](https://www.nasm.org/docs/default-source/pdf/integrated-kettlebell-2014-2-day.pdf), [carry movement](https://www.nasm.org/resource-center/blog/training/functional-strength-training).

Two explicit warm-up instructions changed: the shoulder pass-through stops on pinching rather than suggesting continuing with a wider grip; glute bridges identify the knees/hips/shoulders alignment rather than an ambiguous whole-body straight line. The cardio fallback uses comfortable conversation for an easy pace instead of claiming nasal breathing sets the correct intensity; the movement fallback no longer suggests increasing depth every rep. [Stretching guidance](https://www.nasm.org/resource-center/blog/recovery/stretches-for-beginners), [Floor Bridge](https://www.nasm.org/resource-center/exercise-library/floor-bridge), [effort/talk test](https://www.nasm.org/resource-center/blog/heart-rate-training-zones-explained).

## Source conflicts and retained differences

- [Bench Dips](https://www.nasm.org/resource-center/exercise-library/bench-dips): its movement steps describe dips, but the muscle section describes a deadlift, including raising a barbell from the floor. Did not import that muscle list.
- [Close Grip Bench Press](https://www.nasm.org/resource-center/exercise-library/close-grip-bench-press): the mistakes section discusses pulling/shoulder-over-bar mechanics. Used only the relevant pressing description; did not treat the page as fully validated.
- [Romanian Deadlift Barbell](https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell): grip wording is ambiguous; not used to prescribe a grip change.
- [Seated Leg Curl](https://www.nasm.org/resource-center/exercise-library/seated-leg-curl): machine setup/start-position wording is unclear. Kept the existing forward-lean variation rather than declaring it wrong from this page alone.
- [Arm exercise article](https://blog.nasm.org/workout-plans/9-best-arm-exercises/): contains inconsistent anatomy labels. It is recorded for transparency, not used to replace muscle data.
- The app's incline angle, bench touch convention and high/low cable fly variants differ from some NASM examples. A different valid variation is not evidence of inaccuracy. Did not overwrite them to match NASM's preferred example.
- The legacy library listing and some guessed/retired exercise URLs redirect to generic pages. A successful HTTP response from such a URL is not a usable exercise reference; those redirects are not recorded as verified exercises.

## Outstanding review limits

The rounded-back glute-bias cue for Weighted Back Extension was retained: generic hip-hinge advice does not establish that this particular variation is wrong.

Specific follow-ups are recorded against the affected entries: Medicine Ball V-Up's hands-to-feet cue; High Step-Up's height prescription; inner-chest specificity for Squeeze Press; secure Nordic Curl anchoring; the Trap Bar Deadlift back-safety comparison; Pogo Hops' stiffness cue; and landing on the BOSU dome. These are unresolved questions, not findings that the existing variations are necessarily wrong.

The generated muscle diagrams/primary-secondary assignments (`SLOT_MUS`, `KW`, `EXM`) remain estimates. Slot inheritance can overgeneralize a particular exercise. Single-plane labels can also be misleading for multi-joint or anti-rotation movements. These were inspected but not independently validated or reclassified from incomplete/conflicting NASM references. The JSON inventory's same-movement label does not certify these derived maps.

Program selection, beginner suitability, sets/reps, starting loads, progression, pain exclusions, cardio prescriptions and age/injury-specific advice were not clinically validated. Existing 3D animations were not certified by this written-source audit. Physical-phone checks remain separate from emulated narrow viewports.

## Verification and release

Local isolated development build passed syntax, environment/asset isolation, 49 persistence/workout scenarios and six offline scenarios. The targeted audit browser check passed at 1280, 390 and 320 px: 320 instruction arrays, 92 warm-up entries, nine real library dialogs and three guided dialogs per viewport, unchanged member state/draft, no horizontal overflow, no unexpected console errors or account mutations. The existing real 3D guide suite is checked separately.

The existing five-guide 3D browser suite also passed locally at 1280, 390 and 320 px, including rotation, playback, lifecycle cleanup, state/draft/coach preservation, offline/corrupt-model text fallback and reduced motion.

Runtime candidate `ba96c989a61ebfa3c1d624ac300cc8bbbe2039d8` deployed successfully from dev through Workers Build `9c43ed61-b792-43fd-b9af-9abd92beb78c`. The hosted targeted audit suite passed at [the test app](https://dev.strongstart.app/) at 1280, 390 and 320 px: exact candidate HTML, corrected guide branches, nine library dialogs and three warm-up/cardio dialogs per width, unchanged synthetic state/draft, no unexpected console errors or account mutations. The separate hosted-environment check passed exact build and development backend at all three widths. These checks used isolated synthetic sessions, not authenticated accounts or real workouts.

The first hosted browser attempt was blocked by sandbox network restrictions; the authorized network-enabled rerun passed. No database migrations or production configuration changes are needed. Production was not changed. Publication requires explicit approval under [AGENTS.md](../AGENTS.md); the existing pending development-only 3D guides are a separate release-scope decision. This verification follow-up changes documentation only.
