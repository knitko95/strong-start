# Coordinator instructions

Use this with the repository's `AGENTS.md` and the private feedback workflow. The current request defines the authorized scope; a queue status does not authorize new features or production publication.

1. Fetch and compare dev/main, preserve unrelated local changes and work from current dev in an isolated task worktree. Read the relevant tracker issue and comments; check for competing claims. Record the branch, workspace path, exact exercise IDs and next action in the claim.
2. Read the current asset catalogue and workspace records. Preserve the eighteen imported approvals. Choose a bounded batch, usually six related common moves. Do not rename exercise IDs. Avoid assigning the same exercise to two generators.
3. Give each generator [a filled handoff](templates/batch-handoff.md), [the visual spec](visual-spec.md), exact references, permitted output paths and the current record revision. Set a concrete stopping point: candidate registered and source evidence saved, not owner approval.
4. Claim assigned exercises with a worker and batch identifier. Workers read the shared workspace, but write only their assigned exercise records/assets. A stale revision means stop, reread and reconcile, not blind retry or force overwrite.
5. Assign a different agent to audit the candidate. Supply the exact version ID/fingerprint and form notes. Do not call playback checks a form audit. Collect failed checks, close-ups and unresolved gaps before presenting the owner review.
6. Ask the owner to review the exact candidate against the approved version. A requested correction becomes a new version; carry forward the specific change request and protected regions. Do not reinterpret silence, moving to the next exercise or an old audit as approval.
7. After the authorized integration decision, copy only approved asset versions to the public delivery package, validate hashes and transparency, then test and deploy dev. Record which approved version is on dev; approval itself must not mutate runtime selection. Follow the separate production approval process in `AGENTS.md`.
8. End with a saved handoff: completed IDs/versions, unresolved findings, current revisions, claims to release, local evidence paths, private tracker link and exact next action. Another fresh chat should be able to continue from these files without this conversation.

Suggested parallel arrangement: coordinator, two generators with separate batches, and one independent auditor. Rotate a finished generator into audit work when needed. Keep one integration writer for shared catalogues/build files so asset work does not cause overlapping edits.

## Representative CLI flow

Use `--workspace` consistently when the workspace is not the default. Consult command help for accepted flags.

```powershell
node scripts/pose-review.mjs list
node scripts/pose-review.mjs claim --id dead-bug --worker generator-a --batch core-01 --expected-revision 0
node scripts/pose-review.mjs candidate --id dead-bug --frames pose-0.png pose-1.png --brief brief.json --expected-revision 1
node scripts/pose-review.mjs audit --id dead-bug --version VERSION_ID --file audit.json --expected-revision 2
node scripts/pose-review.mjs release --id dead-bug --worker generator-a --expected-revision 3
node scripts/pose-review.mjs export --out review-handoff.json
```

Revision numbers above are examples. Always reread the record; do not assume a claim, candidate and audit each have the example revision. Generators and auditors must not invoke owner-decision UI actions on the owner's behalf.

For a new known app exercise, claiming creates an empty queued record. Its first candidate must supply `--brief`; use [the brief template](templates/brief.json) for constraints, references and generation provenance. Set the same `--workspace PATH` on every command when different from the default. Do not select an ID solely because it appears in an example; use the assigned batch IDs.
