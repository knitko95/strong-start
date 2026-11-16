# Generator instructions

For shared hosted work, follow [remote workspace access](hosted-workspace.md). Use its current records and authenticated file manifest, not an archived local copy. The remote credential defines the worker identity; it cannot approve artwork or publish a release. Local paths in migrated provenance are retrievable private manifest keys.


Your output is an unapproved candidate for the assigned exercise IDs. Do not change other exercises, mark your own work owner-approved, alter the runtime catalogue or publish a release.

Inspect the exercise record's `reviewReferences` attachments (original image bytes and owner guidance), as well as references on the chosen version. Images attached during owner review apply across revisions even when they were added while viewing an older candidate. Record how each supplied reference affects the new brief; do not assume it was already considered by an earlier generator.

## Before producing images

1. Read the assigned handoff, current record, prior approved version, exact correction notes and [visual spec](visual-spec.md). Confirm your claim and expected revision. Check whether another worker has changed the record.
2. Read the **full exercise entry** in `docs/exercise-technique/catalog-*.md`, its source limitations in `docs/exercise-technique/sources.md`, the exercise's `docs/EXERCISE-SOURCES.md` row, and its existing references in `docs/exercise-visuals/catalog.md` / `entries.json`. Also read the current app cue and any exact exercise-specific guide. The short catalogue cue and a newly found web page are insufficient substitutes. Inspect supplied private form images and available registered visual references; approved instructor artwork is an identity/style anchor, not a technique reference for a different move. Record which images/videos were actually viewed and which were unavailable.
3. Match the references to the app's actual variation. Record start/finish poses, camera direction, grip and equipment. Save a `generation.sourceReview` list in the brief with exact document paths/sections, file hashes, facts applied, conflicts, and missing/unviewed references. Resolve conflicting cues before generation with the coordinator; do not silently choose one. A related reference does not validate the exact variation.
4. Inspect the approved style anchors and every input image. Read the installed image-generation skill before generating or editing raster artwork and follow its current tool instructions. Do not reuse a stale tool recipe from a past chat.
5. Write the fixed/moving-region brief. For a revision, name anatomical and viewer sides, exact editable regions and protected regions. Reuse the approved body/bench/machine where required; do not regenerate everything to fix a wrist.

## Produce and register a candidate

Save the actual prompt, input/reference hashes, untouched generated source, separate pose masters, extraction/registration notes and tool provenance in your assigned local exercise/version folder. Keep an exact before copy. Do not copy supplied reference photos into public assets.

Before registration, inspect both poses at full size and as a direct 900ms loop. Check hands, dumbbell axes, joints, limb count, stable anchors, equipment size and alpha holes on light/dark backgrounds. Do not claim these self-checks are an independent audit.

Register the requested two to four frame files using the CLI `candidate` command with the current expected revision and an active claim. The first candidate for a new exercise **must** supply `--brief FILE`, using [the brief template](templates/brief.json): constraints, references and a `generation` payload containing the actual tool, prompt, source hashes and provenance. Existing revisions may inherit constraints/references, but still supply generation provenance so the change can be reproduced. The store saves the generation payload privately under that version's `generation.json` and retains the supplied frame masters unchanged.

The store records the generating worker on the content-addressed version and preserves the prior approved one. Releasing your claim later does not remove your generator identity or make you an independent reviewer of that version. If the store rejects a revision conflict, reread and coordinate; never edit the record directly to bypass it. A new version starts unreviewed even when it was derived from approved artwork.

Hand the coordinator the exact exercise ID, version ID/fingerprint, source/prompt paths, references, intended changes, protected regions, your observed gaps and the next independent audit action. Release your claim when the coordinator confirms the handoff. Extra review frames require an explicit owner request; the private reviewer accepts up to four frames, while the member runtime remains a separate integration decision.
