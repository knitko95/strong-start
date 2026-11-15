# Detailed form, grips and joint motion — November 13, 2026

This candidate follows the detailed `setup`, `execution`, `alignmentAndRange`, `commonFaults` and `variantNotes` in the [technique register](../exercise-technique/README.md). It supersedes the earlier correction pass's implication of broad technique clearance. Playback, fixed bone lengths and a contact point near the wrist did not establish correct finger placement, anatomical bend direction or the intended variation.

The 296 reference-supported note entries were read, including their variation boundaries. The [assertion record](form-detail.json) identifies the smaller set with automated movement requirements. Reading a note, sharing a rig fix or passing a mechanical check is not individual technique approval for every exercise.

## Corrections

- Moved implement contact from the wrist base to the finger bases. Fingers flex about the palm's transverse axis, with opposed thumbs. Dumbbell handles and hex heads fit that grasp. Sixteen earlier clips receive grip repairs while their original non-digit body nodes and motion samples remain identical.
- Oriented limb skin with its bend plane, retained bone lengths and removed elbow flips from ambiguous poles and changing IK solutions. Floor supports use extended fingers and a palm surface; moving hands in bird-dog and thoracic reaches release from the floor constraint.
- Kept upper arms quiet in curls, pushdowns, skull crushers, overhead triceps extensions and kickbacks. Zottman/Arnold rotation reaches the forearm mesh. Flys keep soft elbow bend; Tate presses use outward elbows and inward-moving bell ends.
- Corrected chest-height forward kneeling cable pressing, the bench bar path, front-rack fingers below a body-supported bar, back-squat/good-morning bar support, and concentration-curl inner-thigh placement.
- Corrected knee planes relative to toes, prone/seated hinges, hanging raises past horizontal, and the long leg in side-lying abduction.
- Added lateral-raise upper-arm pads and shoulder pivots, lower-body machine side grips, floor-pull plates at their resting height and collars. Kettlebells have graspable horns/crossbars; plates follow their edge hold. Landmine end support is separate from a shaft grip, with a loading sleeve and a side-on single-leg RDL station.
- Corrected the single-handle, side-on TRX anti-rotation press and its forward chest-level reach. Other suspension presses face away from their anchors with a connected body line and fixed straps. Ball-throw release/return and follow-through retain continuous hand constraints.

## References and verification

Existing NASM associations and exact URLs remain in the [source register](../EXERCISE-SOURCES.md). The [PureGym barbell curl](https://www.puregym.com/exercises/arms-and-shoulders/bicep-curl/barbell-bicep-curls/) supports a quiet upper arm; its [Zottman text](https://www.puregym.com/exercises/arms-and-shoulders/bicep-curl/zottman-curls/) distinguishes lifting/lowering grips. These text sections were reopened on November 13. The Zottman page's embedded-video accessible description refers to a concentration curl; that conflicting description is not Zottman evidence. Related references for kneeling cable pressing and generic machine designs remain related, rather than becoming exact manufacturer validation.

```powershell
node animation-authoring/build.mjs
node scripts/test-exercise-form-detail.mjs
node scripts/test-animation-corrections.mjs
node scripts/test-exercise-bend-continuity.mjs
node scripts/check-all-exercise-animations.mjs --prune
node scripts/build-dev.mjs
node scripts/test-all-exercise-animations.cjs
node scripts/capture-exercise-form-detail.cjs --output=form-detail/review
```

The detailed checks cover 29 clips at 121 phases, including bilateral finger/thumb closure, quiet elbows, bench bar path/forearms, forward cable pressing, fixed knee pivots, planted feet, long abduction leg, constant fly elbow bend and single-handle suspension pressing. Mechanical checks cover 428 generated clips at 41 phases. Continuity checks cover 241 phases per clip, subdividing large changes to distinguish fast continuous motion from a pop. The package check preserves earlier non-digit body samples byte for byte. The full browser suite checks all 446 demonstrations, app entry points, controls, fallback and phone/desktop layouts.

Four-phase close-ups include hands, elbows, knees and full-body front/side views. Ignored raw evidence and reports are under `output/form-detail/` in the audit worktree; selected images accompany this record. The JSON freezes candidate/notes hashes, exact sources and check scope.

## Review limits

These remain development drafts. Numerical tolerances describe this rig, not clinical ranges. Checks do not certify fine skin collision, every phalanx's mesh contact, manufacturer adjustments/dimensions, individual comfort, breathing, load selection or professional technique approval. Landmine end-cupping, kettlebell horn holds and front-rack fingertip clearance especially warrant close visual review. Repetition loops do not show every setup, unrack, retrieval or exit instruction. The 128 excluded reference entries do not gain source coverage through shared changes. Physical-phone and authenticated-account checks are not established by this animation-only pass.

No database migration or production configuration change is required. This candidate is for the test app; production publication requires approval of the tested release.
