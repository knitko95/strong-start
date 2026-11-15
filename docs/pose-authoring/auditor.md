# Independent audit instructions

Audit another worker's exact candidate version. Your findings support owner review; they are not owner approval, integration authorization or professional technique clearance.

## Establish the evidence

Read the exercise's current form notes, variation, references, previous approved version and requested correction. Confirm the candidate's two frame hashes and combined fingerprint. Record your reviewer/agent identifier and date. If you generated this candidate, ask the coordinator for a different reviewer. Independence is checked against the saved version generator, not just the current claim; a released or reassigned claim does not make the generator independent.

For each reference, record the exact URL or private file identifier, review date, local hash where available, variation match, facts checked, source conflicts and remaining gaps. Use applicable credible primary exercise guidance; a related movement or a visible image alone does not validate all technique claims. If researching external guidance, verify it live and maintain the app's source register/evidence requirements. Keep source references and private reference images outside member-facing exercise instructions unless separately authorized.

## Inspect each pose and the transition

1. **Variation:** standing/seated, unilateral/bilateral, equipment and mechanism match the assigned exercise. The start and finish clearly explain it.
2. **Anatomy:** trace each of two arms and two legs from origin to endpoint. Inspect shoulder attachment, elbow bend, wrist/hand connection, hip/knee/ankle alignment and occlusions. Check enlarged crops of both hands, not just the visible near hand.
3. **Grip/contact:** fingers and opposing thumbs enclose the intended handle; weight axes and plate perspective match the camera. Feet touch the intended floor/platform, body contacts the bench/pads, cables connect to the correct attachment, and weights sit in the specified place.
4. **Movement:** compare against the specific form notes and reference. Check intended range, which joints move, which supports stay fixed and whether the chosen viewpoint hides an essential action. Record uncertainty rather than passing a hidden joint.
5. **Registration:** alternate frames and use overlays/difference views. Stable bench/machine/camera/body regions should remain fixed. Expected body or carriage motion must remain possible; do not confuse a legitimate squat/lunge/seat movement with image drift.
6. **Image quality:** whole subject/equipment present, consistent identity and outfit, true transparency, no neck/skin pinholes, duplicate limbs, clipping, stretched machines or double contours. Check light, dark and checker backgrounds.
7. **Delivery:** equal frame dimensions, correct hashes, supported two-frame timing, preserved masters, source/prompt provenance and no private reference artwork in public packaging.

Use `pass`, `fail` or `not-checked` for each check. Findings need an exercise/version, severity, pose, anatomical/viewer side, observed defect, desired correction and evidence path. “Looks good” and a count of passed renders are not detailed audit evidence.

Fill [the audit template](templates/audit.json), replacing its placeholders before submission. [The schema](templates/audit.schema.json) documents its interchange shape. Required pass-check IDs are `form`, `anatomy`, `grip`, `perspective`, `fixed-elements`, `transparency`, `readability` and `variation`. Mark overall `needs-changes` if a relevant check fails. Use `not-recorded` when the audit is incomplete; use `passed` only when the applicable checks are actually completed with evidence and remaining limits stated. Do not inherit audit results from an earlier fingerprint. Imported owner-approved seed assets intentionally start with no recorded new audit.

Submit with the CLI `audit` command against the current revision and exact version. On conflict reread the latest version and coordinate. A new candidate requires a new audit. The audit does not alter approved/runtime version pointers. Finish by reporting the specific findings and unresolved checks to the coordinator for owner review.
