# Exercise animation form and equipment audit

Reviewed November 13, 2026 against development baseline `9f4fc09cdfa2134d9ce8b7fd371248d356ae98c5`. **The draft library does not pass the form/equipment audit.** This is a reference-guided discrepancy review, not a professional technique certification. No runtime assets were corrected or published by this audit.

## Scope and method

273 source entries qualify: 214 strength exercises, 56 guides and 3 cardio types. Eligibility requires configuration-specific visual evidence or an exercise-specific written same-movement source. A video title alone is insufficient. The other 151 reference entries are explicitly excluded, not passed.

272 clips were rendered in actual Chrome/WebGL at four cycle positions (0%, 25%, 51%, 75%): oblique at all four and side at 0%/51%, 1632 images total. All 42 overview sheets were visually inspected. The marching type is compared only with Easy marching; this does not approve its high-knee/running labels. Air bike has no separate matching clip and is recorded missing rather than substituting the fixed-handle stationary bike.

255 procedural clips were additionally sampled at 41 evenly spaced cycle positions (10455 poses). Measurements inspect rigid equipment/contact targets and hand axes. They are geometric diagnostics, not anatomical joint angles, clinical thresholds, force simulation or collision proof. The 17 previously accepted strength clips receive current sampled visual review, not automatic approval from their historical status.

The reference snapshot preserves all NASM associations and original source links. Per-entry setup/action below uses the existing original research synthesis; disputed generic notes are not treated as authority over the exercise-specific setup. Full continuous third-party video/narration review was not performed. Equipment models were checked for a mechanically recognisable configuration, not a certified replica of every manufacturer model.

## Results

| Outcome | Entries |
| --- | ---: |
| no-additional-discrepancy-observed | 58 |
| closer-review-required | 39 |
| corrections-required | 175 |
| missing-animation | 1 |

**No-additional-discrepancy-observed is a limited sampled result, not safe/correct/approved.** Closer-review-required means a geometric hand-axis flag or another unresolved detail remains; it is not a proven clinical fault. Corrections-required means at least one concrete rendered/authoring discrepancy is listed.

## Priority corrections

Fix support and load constraints before polishing surfaces: planted palms/back/feet, real grips, rigid machine/landmine paths, correct implements and named movement sequences. Re-render and compare the corrected exercises individually before any release decision. Existing playback/build tests establish delivery and finite transforms, not form accuracy.

## Findings

### E01: Smith bar is disconnected from its rails

**P1 — observed:** Smith bench-press shaft depth is about 0.473 m from rails at Z=0. The squat shaft also moves 0.140 m in depth across a vertical rail system; split-squat shaft is offset about 0.065 m. No guide carriages, hooks or stops are depicted.

**Required correction:** Constrain a rigid bar and its carriages to a defined rail path; align the bench/stance to it and model recognisable catches/stops.

**Affected (3):** [smith-machine-bench-press](entries.md#smith-machine-bench-press), [smith-machine-squat](entries.md#smith-machine-squat), [smith-machine-split-squat](entries.md#smith-machine-split-squat).

### E02: Landmine bar changes length

**P1 — observed:** All six eligible landmine shafts are rebuilt between a fixed pivot and a freely prescribed hand path. Their length changes by 0.176–0.487 m per cycle.

**Required correction:** Keep shaft length fixed; solve hand/load motion on the pivot sphere, attach the plate to that rigid shaft and preserve the intended grip.

**Affected (6):** [half-kneeling-landmine-press](entries.md#half-kneeling-landmine-press), [landmine-rotational-push-press](entries.md#landmine-rotational-push-press), [landmine-t-bar-row](entries.md#landmine-t-bar-row), [meadows-row](entries.md#meadows-row), [landmine-single-leg-romanian-deadlift](entries.md#landmine-single-leg-romanian-deadlift), [landmine-lateral-lunge](entries.md#landmine-lateral-lunge).

### E03: Cable does not connect to the depicted station

**P1 — observed:** Station uprights are at Z=-0.72 m, while most front/side/high cable anchors are at Z=+0.88 m with no pulley or structure there. Rear anchors also lack depicted pulleys/stack routing. Straight lines and rings do not establish a working cable machine.

**Required correction:** Place working pulleys on the frame at exercise-specific height/direction; connect the cable and correct attachment to the load path.

**Affected (25):** [single-arm-cable-chest-press](entries.md#single-arm-cable-chest-press), [cable-fly-high-to-low](entries.md#cable-fly-high-to-low), [cable-fly-low-to-high](entries.md#cable-fly-low-to-high), [half-kneeling-single-arm-cable-press](entries.md#half-kneeling-single-arm-cable-press), [cable-lateral-raise](entries.md#cable-lateral-raise), [cable-rope-pushdown](entries.md#cable-rope-pushdown), [overhead-cable-triceps-extension](entries.md#overhead-cable-triceps-extension), [single-arm-cable-kickback](entries.md#single-arm-cable-kickback), [cable-woodchop-high-to-low](entries.md#cable-woodchop-high-to-low), [cable-lift-low-to-high](entries.md#cable-lift-low-to-high), [pallof-press](entries.md#pallof-press), [cable-crunch](entries.md#cable-crunch), [lat-pulldown](entries.md#lat-pulldown), [close-grip-lat-pulldown](entries.md#close-grip-lat-pulldown), [single-arm-lat-pulldown](entries.md#single-arm-lat-pulldown), [seated-cable-row](entries.md#seated-cable-row), [single-arm-rotational-cable-row](entries.md#single-arm-rotational-cable-row), [straight-arm-cable-pulldown](entries.md#straight-arm-cable-pulldown), [half-kneeling-single-arm-cable-row](entries.md#half-kneeling-single-arm-cable-row), [cable-face-pull](entries.md#cable-face-pull), [cable-curl](entries.md#cable-curl), [cable-pull-through](entries.md#cable-pull-through), [cable-glute-kickback](entries.md#cable-glute-kickback), [cable-hip-abduction](entries.md#cable-hip-abduction), [cable-hip-adduction](entries.md#cable-hip-adduction).

### E04: Machine arms telescope instead of pivoting

**P1 — observed:** Generic machine moving levers are cylinders rebuilt from a fixed frame point to a hand, so their lengths change. For chest press, the inspected lever grows from about 0.479 to 0.765 m. The same construction serves unrelated machine actions.

**Required correction:** Choose a recognisable machine mechanism with fixed-length lever arms, suitable pivot/handle axes, support pads and a plausible resistance linkage.

**Affected (9):** [machine-chest-press](entries.md#machine-chest-press), [incline-machine-press](entries.md#incline-machine-press), [pec-deck](entries.md#pec-deck), [machine-shoulder-press](entries.md#machine-shoulder-press), [machine-lateral-raise](entries.md#machine-lateral-raise), [machine-triceps-extension](entries.md#machine-triceps-extension), [machine-torso-rotation](entries.md#machine-torso-rotation), [machine-ab-crunch](entries.md#machine-ab-crunch), [machine-preacher-curl](entries.md#machine-preacher-curl).

### E05: Loaded hands do not wrap around the equipment

**P1 — observed:** The new pose code closes fingers for dumbbells/bars/cables but omits machine, pull-up and dip equipment codes. Open hands visibly pass through or sit beside the bars/levers.

**Required correction:** Author palms, thumbs and fingers around actual handle surfaces and solve the wrist/forearm alignment from that grip.

**Affected (34):** [smith-machine-bench-press](entries.md#smith-machine-bench-press), [machine-chest-press](entries.md#machine-chest-press), [incline-machine-press](entries.md#incline-machine-press), [weighted-dip](entries.md#weighted-dip), [pec-deck](entries.md#pec-deck), [machine-shoulder-press](entries.md#machine-shoulder-press), [machine-lateral-raise](entries.md#machine-lateral-raise), [machine-triceps-extension](entries.md#machine-triceps-extension), [machine-torso-rotation](entries.md#machine-torso-rotation), [hanging-oblique-knee-raise](entries.md#hanging-oblique-knee-raise), [hanging-leg-raise](entries.md#hanging-leg-raise), [machine-ab-crunch](entries.md#machine-ab-crunch), [weighted-pull-up](entries.md#weighted-pull-up), [chin-up](entries.md#chin-up), [neutral-grip-pull-up](entries.md#neutral-grip-pull-up), [machine-preacher-curl](entries.md#machine-preacher-curl), [hack-squat](entries.md#hack-squat), [leg-press](entries.md#leg-press), [smith-machine-squat](entries.md#smith-machine-squat), [smith-machine-split-squat](entries.md#smith-machine-split-squat), [single-leg-leg-press](entries.md#single-leg-leg-press), [lying-leg-curl](entries.md#lying-leg-curl), [seated-leg-curl](entries.md#seated-leg-curl), [glute-ham-raise](entries.md#glute-ham-raise), [leg-extension](entries.md#leg-extension), [single-leg-extension](entries.md#single-leg-extension), [hip-adduction-machine](entries.md#hip-adduction-machine), [hip-abduction-machine](entries.md#hip-abduction-machine), [standing-calf-raise-machine](entries.md#standing-calf-raise-machine), [leg-press-calf-raise](entries.md#leg-press-calf-raise), [hanging-knee-raise](entries.md#hanging-knee-raise), [assisted-pull-up-machine](entries.md#assisted-pull-up-machine), [back-extension](entries.md#back-extension), [dead-hang](entries.md#dead-hang).

### E06: Floor or bench support through the hands is missing

**P1 — observed:** In the inspected push-up, pike, quadruped and rollout-derived poses, palms hang down or float rather than lying on their support. The pike variants become unsupported forward leans. Elbow/ankle targets passing a rig check does not establish skin contact.

**Required correction:** Solve planted palm/forearm contact, shoulder-over-support alignment and reachable arm targets before the trunk motion; preserve contact throughout the loaded phase.

**Affected (27):** [weighted-push-up](entries.md#weighted-push-up), [feet-on-ball-push-up](entries.md#feet-on-ball-push-up), [pike-push-up](entries.md#pike-push-up), [diamond-push-up](entries.md#diamond-push-up), [stability-ball-rollout](entries.md#stability-ball-rollout), [stir-the-pot](entries.md#stir-the-pot), [stability-ball-pike](entries.md#stability-ball-pike), [trx-body-saw](entries.md#trx-body-saw), [trx-pike](entries.md#trx-pike), [barbell-rollout](entries.md#barbell-rollout), [feet-on-box-decline-push-up](entries.md#feet-on-box-decline-push-up), [medicine-ball-push-up](entries.md#medicine-ball-push-up), [bosu-mountain-climber](entries.md#bosu-mountain-climber), [ab-wheel-rollout](entries.md#ab-wheel-rollout), [cat-cow](entries.md#cat-cow), [downward-dog-to-plank](entries.md#downward-dog-to-plank), [explosive-push-ups](entries.md#explosive-push-ups), [inchworms](entries.md#inchworms), [incline-push-ups-on-a-bench](entries.md#incline-push-ups-on-a-bench), [incline-push-ups](entries.md#incline-push-ups), [push-up-to-downward-dog](entries.md#push-up-to-downward-dog), [push-ups](entries.md#push-ups), [scap-push-ups](entries.md#scap-push-ups), [bird-dogs](entries.md#bird-dogs), [world-s-greatest-stretch](entries.md#world-s-greatest-stretch), [child-s-pose](entries.md#child-s-pose), [cobra-stretch](entries.md#cobra-stretch).

### E07: Suspension setup is not mechanically constrained

**P1 — observed:** Straps use independently prescribed endpoints and may change length during a rep; changes range up to 0.370 m in the single-leg squat. Most anchors are floating above the frame, and foot-supported variants use a hand-ring shape instead of a foot cradle.

**Required correction:** Use a stable depicted anchor, fixed adjusted strap lengths and the correct hand/foot attachment; solve body motion from the suspension geometry.

**Affected (15):** [trx-chest-press](entries.md#trx-chest-press), [trx-fly](entries.md#trx-fly), [trx-triceps-extension](entries.md#trx-triceps-extension), [trx-anti-rotation-press](entries.md#trx-anti-rotation-press), [trx-body-saw](entries.md#trx-body-saw), [trx-pike](entries.md#trx-pike), [trx-fallout](entries.md#trx-fallout), [trx-row](entries.md#trx-row), [trx-single-arm-row](entries.md#trx-single-arm-row), [trx-power-pull](entries.md#trx-power-pull), [trx-face-pull](entries.md#trx-face-pull), [trx-biceps-curl](entries.md#trx-biceps-curl), [trx-single-leg-squat](entries.md#trx-single-leg-squat), [trx-lateral-lunge](entries.md#trx-lateral-lunge), [trx-hamstring-curl](entries.md#trx-hamstring-curl).

### E08: Incline bench tilts opposite to the body

**P1 — observed:** The new incline barbell press uses a single pad rotated -30 degrees whose high end is toward the feet, while the upper torso is raised toward the head. The torso is visibly unsupported.

**Required correction:** Use separate seat/back pads with the backrest rising toward the head and continuous head/back/pelvis support.

**Affected (1):** [incline-barbell-bench-press](entries.md#incline-barbell-bench-press).

### E09: Overhead press starts with a collapsed rack

**P1 — observed:** New overhead recipes place wrists below raised elbows, creating a low upright-row-like bottom rather than a supported press rack. The Arnold grip switches by a threshold rather than a smooth turn.

**Required correction:** Set the appropriate bar/dumbbell/kettlebell rack with stacked load/wrist/forearm, then author an exercise-specific press path and smooth rotation.

**Affected (9):** [push-press](entries.md#push-press), [z-press](entries.md#z-press), [machine-shoulder-press](entries.md#machine-shoulder-press), [half-kneeling-landmine-press](entries.md#half-kneeling-landmine-press), [single-arm-kettlebell-overhead-press](entries.md#single-arm-kettlebell-overhead-press), [bottoms-up-kettlebell-press](entries.md#bottoms-up-kettlebell-press), [arnold-press](entries.md#arnold-press), [half-kneeling-single-arm-cable-press](entries.md#half-kneeling-single-arm-cable-press), [band-overhead-press](entries.md#band-overhead-press).

### E10: Kettlebell shape is not fitted to the loaded wrist

**P1 — observed:** The bell body is positioned by a fixed world-vertical offset from the hand and does not follow the forearm orientation. Rack/overhead/windmill/get-up poses show the handle or bell beside an unsupported/open-looking wrist.

**Required correction:** Fit a rigid handle/bell assembly to a real grip, show the outside-forearm rest for conventional holds and maintain the distinct bottoms-up orientation.

**Affected (8):** [kettlebell-floor-press](entries.md#kettlebell-floor-press), [single-arm-kettlebell-overhead-press](entries.md#single-arm-kettlebell-overhead-press), [bottoms-up-kettlebell-press](entries.md#bottoms-up-kettlebell-press), [kettlebell-windmill](entries.md#kettlebell-windmill), [kettlebell-farmer-s-carry](entries.md#kettlebell-farmer-s-carry), [kettlebell-front-rack-carry](entries.md#kettlebell-front-rack-carry), [overhead-kettlebell-carry](entries.md#overhead-kettlebell-carry), [turkish-get-up](entries.md#turkish-get-up).

### E11: Two kettlebells replace the two-hand swing

**P1 — observed:** The kettlebell swing creates one bell per hand even though both hands are targeted near the centre. Two bodies overlap; the wrist pose is severely bent.

**Required correction:** Show one rigid bell with both hands on its handle; author the hinge-driven ballistic path and its controlled return.

**Affected (1):** [kettlebell-swing](entries.md#kettlebell-swing).

### E12: Hack squat lacks its defining machine

**P1 — observed:** The hack squat consists only of a floor frame and uprights. There is no sled, shoulder support, backrest, footplate or safety system.

**Required correction:** Author a supported hack-squat sled and footplate with a coherent rail path; keep back/shoulder/foot contacts through the cycle.

**Affected (1):** [hack-squat](entries.md#hack-squat).

### E13: Leg-press feet move through a static footplate

**P1 — observed:** The seat and footplate remain fixed while the feet translate about 0.347 m. Duplicate back/seat supports disagree with the body; the back is visibly off the inclined support. The calf variant also changes leg position against a static plate.

**Required correction:** Choose a sled or moving-seat model, maintain sole/forefoot contact and pelvis/back support, and move the correct carriage. Keep knee angle nearly constant for calf raises.

**Affected (3):** [leg-press](entries.md#leg-press), [single-leg-leg-press](entries.md#single-leg-leg-press), [leg-press-calf-raise](entries.md#leg-press-calf-raise).

### E14: Machine support and linkage are incomplete

**P1 — observed:** Leg rollers and hip pads follow joint points without the lever/axis/restraint system that carries the load. Seated curls lack thigh restraint; the single-leg extension roller remains bilateral.

**Required correction:** Model the machine pivot, correct pad contact and restraint for the selected variant. Align the user to the pivot and keep the nonworking side independent.

**Affected (6):** [lying-leg-curl](entries.md#lying-leg-curl), [seated-leg-curl](entries.md#seated-leg-curl), [leg-extension](entries.md#leg-extension), [single-leg-extension](entries.md#single-leg-extension), [hip-adduction-machine](entries.md#hip-adduction-machine), [hip-abduction-machine](entries.md#hip-abduction-machine).

### E15: Glute-ham raise uses a floor Nordic setup

**P1 — observed:** The glute-ham raise reuses the kneeling Nordic pose, a low knee block and low heel roller inside a generic frame. There is no GHD hip/knee pad or raised footplate restraint.

**Required correction:** Author the documented GHD configuration and knee-flexion action with secure feet; retain Nordic curl as a separate setup.

**Affected (1):** [glute-ham-raise](entries.md#glute-ham-raise).

### E16: Standing calf machine has no shoulder load or step

**P1 — observed:** The machine is only a generic base and uprights; no shoulder pads, resistance linkage or forefoot platform is present.

**Required correction:** Provide a recognisable loaded calf-raise machine with secure forefoot support, shoulder pad contact and controlled ankle motion.

**Affected (1):** [standing-calf-raise-machine](entries.md#standing-calf-raise-machine).

### E17: Inverted row depicts suspension equipment

**P1 — observed:** The inverted-row scene contains two suspension straps and rings, and no horizontal bar.

**Required correction:** Use a fixed horizontal bar and bar grip at an appropriate height; retain the suspension version under TRX Row.

**Affected (1):** [inverted-row](entries.md#inverted-row).

### E18: Neutral pull-up lacks neutral handles

**P1 — observed:** The same straight horizontal pull-up bar is used for the neutral-grip version. Hands do not have parallel fore-aft handles to grasp.

**Required correction:** Add parallel neutral-grip handles and fit both palms/forearms to them.

**Affected (1):** [neutral-grip-pull-up](entries.md#neutral-grip-pull-up).

### E19: Pulldown and rope attachments do not match the movement

**P1 — observed:** Lat pulldown uses independent rings rather than the documented bar/V attachment, and no thigh restraint. Rope pushdown/face pull use separate cable rings without a rope.

**Required correction:** Use the documented exercise attachment, a shared cable where appropriate, and correct seat/thigh support; preserve the individual-handle option only when it is the stated variant.

**Affected (5):** [cable-rope-pushdown](entries.md#cable-rope-pushdown), [overhead-cable-triceps-extension](entries.md#overhead-cable-triceps-extension), [lat-pulldown](entries.md#lat-pulldown), [close-grip-lat-pulldown](entries.md#close-grip-lat-pulldown), [cable-face-pull](entries.md#cable-face-pull).

### E20: Preacher or concentration support is misplaced

**P1 — observed:** Concentration curl is an upright seated curl without the elbow supported on the inner thigh. The preacher pad is in front of the chest while the upper arms pass below or beside it.

**Required correction:** Place the relevant elbow/upper-arm surface on the thigh or preacher pad and retain that contact through elbow flexion.

**Affected (2):** [machine-preacher-curl](entries.md#machine-preacher-curl), [concentration-curl](entries.md#concentration-curl).

### E21: Barbell rollout is drawn as an ab wheel

**P1 — observed:** The barbell-rollout branch excludes the ordinary barbell and builds one narrow wheel plus a short handle.

**Required correction:** Use a barbell with rolling plates at both ends and a rigid shaft; keep plates in contact with the floor.

**Affected (1):** [barbell-rollout](entries.md#barbell-rollout).

### E22: Ab wheel floats above the floor

**P1 — observed:** The wheel centre follows the hand rather than its radius above the floor. Authored centre heights of about 0.207–0.247 m exceed its 0.12 m radius, leaving a visible gap.

**Required correction:** Constrain rolling contact to the floor and solve hand/knee/body positions around the rigid axle.

**Affected (1):** [ab-wheel-rollout](entries.md#ab-wheel-rollout).

### E23: Supine support is lost

**P1 — observed:** New dead-bug/bridge/supine poses lift or intersect the head/upper back instead of retaining the required floor support. In bridges the trunk is rotated as a rigid unit rather than pivoting around a planted upper back.

**Required correction:** Keep head/upper-back contacts on the mat and solve hip movement or opposite-limb reach independently; check the complete skin surface.

**Affected (10):** [dead-bug](entries.md#dead-bug), [barbell-hip-thrust](entries.md#barbell-hip-thrust), [dumbbell-hip-thrust](entries.md#dumbbell-hip-thrust), [single-leg-hip-thrust](entries.md#single-leg-hip-thrust), [stability-ball-squeeze-bridge](entries.md#stability-ball-squeeze-bridge), [dumbbell-glute-bridge](entries.md#dumbbell-glute-bridge), [glute-bridges](entries.md#glute-bridges), [dead-bugs](entries.md#dead-bugs), [single-leg-glute-bridges](entries.md#single-leg-glute-bridges), [figure-4-glute-stretch](entries.md#figure-4-glute-stretch).

### E24: Hip thrust does not keep the upper back on the bench

**P1 — observed:** The body rotates around the pelvis and the back leaves the pad. Added dumbbell is a single cylinder with no recognisable handle/heads or hip padding.

**Required correction:** Anchor the upper-back contact to the bench edge, move the hips beneath it and fit the actual padded load across the hip crease.

**Affected (3):** [barbell-hip-thrust](entries.md#barbell-hip-thrust), [dumbbell-hip-thrust](entries.md#dumbbell-hip-thrust), [single-leg-hip-thrust](entries.md#single-leg-hip-thrust).

### E25: Squeeze bridge places the ball under the feet

**P1 — observed:** A large ball supports the elevated feet; the documented squeeze version needs a small ball between the knees with feet on the floor.

**Required correction:** Use the referenced knee-squeeze configuration; do not silently substitute a feet-on-ball bridge.

**Affected (1):** [stability-ball-squeeze-bridge](entries.md#stability-ball-squeeze-bridge).

### E26: Decline sit-up has a flat unrestrained bench

**P1 — observed:** The weighted decline sit-up uses a horizontal pad with no ankle restraint. The torso leaves it while the legs are not secured.

**Required correction:** Use a documented decline bench and ankle support; fit the load and controlled trunk motion to that setup.

**Affected (1):** [weighted-decline-sit-up](entries.md#weighted-decline-sit-up).

### E27: Load or grip does not match the intended implement

**P1 — observed:** The pinch carry has a single plate centred between the hands at the pelvis rather than edge-pinched plates at the sides. The dumbbell pullover and Russian twist create two bells rather than the documented two-hand single bell.

**Required correction:** Model the correct implement count, hand contact and load placement; maintain a rigid grip through the motion.

**Affected (3):** [dumbbell-russian-twist](entries.md#dumbbell-russian-twist), [dumbbell-pullover](entries.md#dumbbell-pullover), [plate-pinch-carry](entries.md#plate-pinch-carry).

### E28: Raised rear foot misses its support

**P1 — observed:** Bulgarian split-squat rear foot is placed at an authored ankle coordinate without fitting the sole/instep to the bench. The box version adds a box under the front region plus a separate rear bench, contradicting its documented rear-box setup.

**Required correction:** Place the correct support under the rear instep/forefoot, choose front stance accordingly, and preserve that contact through the rep.

**Affected (2):** [bulgarian-split-squat](entries.md#bulgarian-split-squat), [box-bulgarian-split-squat](entries.md#box-bulgarian-split-squat).

### E29: Decline push-up box is under the hands

**P1 — observed:** The box is built at positive Z near the hands while elevated feet are at negative Z. It intersects the upper body and leaves the feet unsupported.

**Required correction:** Place the box under the feet, fit both forefeet to its top and keep palms on the floor.

**Affected (1):** [feet-on-box-decline-push-up](entries.md#feet-on-box-decline-push-up).

### E30: Walking/reverse lunge lacks its step sequence

**P1 — observed:** These names reuse a fixed split stance with a vertical dip. Walking does not advance the next step; reverse lunge does not step backward and return.

**Required correction:** Author the requested step, weight transfer and return/next step, with planted support during the lowering phase.

**Affected (3):** [barbell-reverse-lunge](entries.md#barbell-reverse-lunge), [dumbbell-walking-lunge](entries.md#dumbbell-walking-lunge), [walking-lunges](entries.md#walking-lunges).

### E31: Depth jump starts on the floor

**P1 — observed:** The generic jump recipe begins with floor feet and rises toward a box instead of starting on the box, stepping off, landing and rebounding.

**Required correction:** Author the documented drop-box sequence, including a controlled step off and distinct landing/rebound phases.

**Affected (1):** [depth-jump](entries.md#depth-jump).

### E32: Lateral box placement disagrees with the jump

**P1 — observed:** The generic box is in front at Z=0.50 m while the lateral jump moves the body in X. Box/foot support does not follow the requested lateral arrangement.

**Required correction:** Align a side box with the jump direction and solve takeoff, clearance, landing and step-down contacts.

**Affected (1):** [lateral-box-jump](entries.md#lateral-box-jump).

### E33: BOSU hand or forearm support is misplaced

**P1 — observed:** The side-plank dome is under the trunk instead of the loaded forearm, and mountain-climber hands are not fitted to the inverted base.

**Required correction:** Fit the selected equipment orientation and loaded contact surfaces; maintain reach and support geometry through the cycle.

**Affected (2):** [bosu-mountain-climber](entries.md#bosu-mountain-climber), [bosu-side-plank](entries.md#bosu-side-plank).

### E34: Side-lying straight-leg raise bends the knee

**P1 — observed:** The free foot is moved upward while the default knee solver folds the knee; the reference calls for a long top leg moving from the hip.

**Required correction:** Author hip abduction with a controlled extended knee, supported bottom side and quiet pelvis.

**Affected (1):** [side-lying-hip-abduction](entries.md#side-lying-hip-abduction).

### E35: Hip airplane is only a single-leg hinge

**P1 — observed:** The hip-airplane entry uses the singleHinge recipe without any pelvis-opening/closing rotation.

**Required correction:** Keep a supported single-leg hinge and rotate the pelvis around the standing hip without substituting a deeper hinge.

**Affected (1):** [hip-airplanes](entries.md#hip-airplanes).

### E36: Wall or post contact is absent

**P1 — observed:** The wall is only two outside uprights and a top rail, so the palm/back contact area is empty. Several other support-hand targets also have no post.

**Required correction:** Use an actual support plane/post at the hand or back contact and fit the body to it; a hidden or omitted wall must be clearly intentional and still have consistent contact.

**Affected (5):** [ankle-rocks-against-a-wall](entries.md#ankle-rocks-against-a-wall), [wall-push-ups](entries.md#wall-push-ups), [wall-slides](entries.md#wall-slides), [biceps-wall-stretch](entries.md#biceps-wall-stretch), [wall-sit](entries.md#wall-sit).

### E37: Pass-through has no towel or stick

**P1 — observed:** The guide creates an arm motion but no implement because its equipment list is empty.

**Required correction:** Show the towel/stick spanning both hands with a wide comfortable grip and a coherent overhead pass-through path.

**Affected (1):** [broomstick-or-towel-pass-throughs](entries.md#broomstick-or-towel-pass-throughs).

### E38: Inchworm lacks hand walking

**P1 — observed:** Both hands move together by the same short Z offset; there are no alternating planted hand steps from standing to plank.

**Required correction:** Author sequential hand placements and the chosen return/foot walk while preserving support.

**Affected (1):** [inchworms](entries.md#inchworms).

### E39: Push-up-to-downward-dog omits the push-up

**P1 — observed:** The entry shares only the plank-to-inverted-V recipe; it has no distinct elbow-flexion push-up phase.

**Required correction:** Add the documented push-up before the hip shift to downward dog, with planted palms and reachable shoulders.

**Affected (1):** [push-up-to-downward-dog](entries.md#push-up-to-downward-dog).

### E40: Scapular push-up uses body lift rather than scapular action

**P1 — observed:** The pose changes pelvis height by 0.025 m while the arm solver bends to maintain hand targets. It does not explicitly author shoulder-blade protraction/retraction with straight elbows.

**Required correction:** Author the small shoulder-girdle movement with stable elbows, trunk and palms; document the simplified scapular rig boundary.

**Affected (1):** [scap-push-ups](entries.md#scap-push-ups).

### E41: Open book does not retain a stacked side-lying base

**P1 — observed:** The displayed legs are rolled upward and the whole trunk/hip transform rotates; the documented supported side-lying knees and upper-trunk rotation are not maintained.

**Required correction:** Support the head and stacked bent knees, keep the pelvis quiet and open the top shoulder/arm through a comfortable range.

**Affected (2):** [open-books-lying-on-your-side](entries.md#open-books-lying-on-your-side), [thoracic-open-books](entries.md#thoracic-open-books).

### E42: Stretch grip or support is missing

**P1 — observed:** Standing quad stretch hand stays beside the thigh and never holds the raised ankle; overhead triceps stretch lacks the guiding elbow contact; wrist guide shows only a static generic hand pose, not both wrist directions.

**Required correction:** Author the specific assisted hand contact and documented stretch direction; show a controlled release and distinguish the paired wrist variants.

**Affected (3):** [overhead-triceps-stretch](entries.md#overhead-triceps-stretch), [standing-quad-stretch](entries.md#standing-quad-stretch), [wrist-flexor-and-extensor-stretch](entries.md#wrist-flexor-and-extensor-stretch).

### E43: Sled hands and equipment do not move coherently

**P1 — observed:** Sled remains fixed while the marching body moves its limbs; push palms droop above the posts and pull straps change length.

**Required correction:** Grip the posts/straps at actual contact points and move the sled/body together, or clearly author an in-place demonstration that preserves their relative geometry.

**Affected (2):** [sled-push](entries.md#sled-push), [sled-pull](entries.md#sled-pull).

### E44: Shadow boxing loses the guard and wrist line

**P1 — observed:** New boxing poses use open drooping hands at chest height rather than fists returning to a face-level guard; the generic rotation is not tied to foot pivots.

**Required correction:** Author relaxed fists, wrist/forearm alignment, a returning guard and coherent foot/hip rotation for the chosen basic punches.

**Affected (1):** [shadow-boxing](entries.md#shadow-boxing).

### E45: Farmer carry curls the arms

**P1 — observed:** The carry recipe sets wrists near waist height and the IK solution noticeably flexes the elbows, bringing bells toward the hips rather than hanging at the sides.

**Required correction:** Place the loaded hands below the shoulders with comfortably long arms, stable trunk and a coherent walking support cycle.

**Affected (2):** [dumbbell-farmer-s-carry](entries.md#dumbbell-farmer-s-carry), [kettlebell-farmer-s-carry](entries.md#kettlebell-farmer-s-carry).

### E46: Front rack carry lacks a rack

**P1 — observed:** Both bells hang centrally below horizontal forearms instead of resting outside the forearms near the torso.

**Required correction:** Fit two actual rack holds with supported wrists/forearms and bell bodies; preserve that load position during the walk.

**Affected (1):** [kettlebell-front-rack-carry](entries.md#kettlebell-front-rack-carry).

### E47: Deadlift bottom does not reach the ground

**P1 — observed:** The conventional and sumo clips finish their lowered phase with the loaded plates above the floor and no start/reset on the ground.

**Required correction:** Use the plate radius to set the ground start, then solve stance, grip, hips and knees from that position; keep the bar near the legs.

**Affected (2):** [conventional-deadlift](entries.md#conventional-deadlift), [sumo-deadlift](entries.md#sumo-deadlift).

### E48: Bar support needs a closer surface check

**P2 — observed:** The front and Zercher squat bars are placed from the hand midpoint; no shoulder/elbow contact constraint exists. The inspected rack poses warrant close-up checking, but these samples alone do not establish the exact skin-to-bar gap.

**Required correction:** Check the bar against the shoulder/elbow surface and solve the grip around that support; do not treat hand attachment alone as proof of support.

**Affected (2):** [front-squat](entries.md#front-squat), [zercher-squat](entries.md#zercher-squat).

### E49: Single-arm row support hand misses the bench

**P1 — observed:** The support hand is targeted at an edge but hangs below/alongside the pad while the bent leg is not fitted to a stable knee/shin contact.

**Required correction:** Fit a planted support palm and knee/shin to the bench and keep that contact while the working arm rows.

**Affected (2):** [single-arm-dumbbell-row](entries.md#single-arm-dumbbell-row), [kettlebell-single-arm-row](entries.md#kettlebell-single-arm-row).

### E50: Torso crunch is a rigid hip tilt

**P1 — observed:** Cable/machine/ball crunch recipes rotate the entire trunk about the pelvis with no segmental spinal flexion. The ball version lifts the torso away from its support.

**Required correction:** Author a controlled trunk curl with stable pelvis and the correct pad/ball support, without substituting only a hip hinge.

**Affected (4):** [ball-crunch](entries.md#ball-crunch), [cable-crunch](entries.md#cable-crunch), [machine-ab-crunch](entries.md#machine-ab-crunch), [weighted-decline-sit-up](entries.md#weighted-decline-sit-up).

### E51: Plate hands pass through the plate

**P1 — observed:** The grip plate is placed at the hand midpoint with no edge/rim/hole grip fitting. In the front raise and halo, hands visually overlap the solid disc.

**Required correction:** Use a specific plate grip at its rim or openings and maintain the rigid plate orientation through the path.

**Affected (2):** [plate-front-raise](entries.md#plate-front-raise), [plate-halo](entries.md#plate-halo).

### E52: Bench dip passes through the bench

**P1 — observed:** Hands are held at a fixed point while the pelvis crosses below/through the pad rather than descending in front of its edge.

**Required correction:** Set the hand heel on the front edge, feet ahead and pelvis in front of the bench; retain an appropriate controlled shoulder range.

**Affected (1):** [bench-dip](entries.md#bench-dip).

### E53: Pendlay row lacks a settled floor start

**P1 — observed:** The lowered plates remain above the floor and no blocks are shown, although the documented variant resets each pull on a settled support.

**Required correction:** Set the bar/plate radius on the floor or intentional blocks and include a controlled reset before each pull.

**Affected (1):** [pendlay-row](entries.md#pendlay-row).

### E54: Zottman rotation changes abruptly

**P1 — observed:** Grip is selected by the binary condition t>0.5 instead of an authored continuous forearm turn. This creates an abrupt hand/load reorientation at the top and again at the loop boundary.

**Required correction:** Keep the curl path and author a smooth top pronation, controlled pronated descent and smooth bottom return.

**Affected (1):** [zottman-curl](entries.md#zottman-curl).

### E55: Around-the-world omits the hand transfer

**P1 — observed:** Both hands follow the same circular path separated by only 0.10 m, and the bell is attached to their midpoint. It never changes from one hand to the other.

**Required correction:** Author the front/back transfers with the free hand reaching to receive the handle and the bell remaining rigid in the working grip.

**Affected (1):** [kettlebell-around-the-world](entries.md#kettlebell-around-the-world).

### E56: Anchored band floats without an anchor

**P1 — observed:** The triceps pushdown, Pallof, woodchop and prone curl use free-standing mathematical anchor points; no rated post/door anchor/bar is depicted there.

**Required correction:** Show the intended fixed support and band attachment at the documented height and direction; retain the correct limb cuff/hand contact.

**Affected (4):** [band-triceps-pushdown](entries.md#band-triceps-pushdown), [band-pallof-press](entries.md#band-pallof-press), [band-woodchop](entries.md#band-woodchop), [prone-band-hamstring-curl](entries.md#prone-band-hamstring-curl).

## Recheck evidence and limits

[Per-exercise findings and references](entries.md), [machine-readable audit and frozen hashes](audit.json), [selected rendered evidence](evidence/README.md). Full capture images, 42 contact sheets, raw matrices and local review gallery are retained in `output/technique-audit/` in the audit worktree; generated files are excluded from deployment. The capture and measurement scripts in `scripts/` reproduce the recorded geometry from the frozen source. Re-running them against changed assets is a new candidate, not verification of this snapshot.

Current capture has zero uncaught page errors and one character load in each browser run. No account or database was accessed: the renderer was mounted in a standalone local harness. This does not test authenticated journeys, physical phones, clinical appropriateness, breathing, load selection, pain tolerance, full skin collision or continuous source-video technique.

No database migration or production configuration change is pending for this documentation audit. Identified animation defects remain unresolved. No release approval is requested for those assets.
