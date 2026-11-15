# Exercise pose authoring

This is the handoff for creating, auditing and reviewing exercise images without depending on one long chat. Start a fresh batch from these files and its saved exercise records. The eighteen imported pairs are owner-approved artwork; their imported audit state is **not recorded**, not a newly completed form audit.

## Start a review session

From the repository's current dev worktree:

```powershell
node scripts/pose-review.mjs init
node scripts/serve-pose-review.mjs --port 8734 --workspace output/pose-review-workspace
```

Open the URL printed by the server. Local workspace mode saves exercise records and review history to disk. Subagents use the same explicit workspace path. Keep that workspace outside the public runtime and out of Git. The hosted development dashboard uses browser-local drafts instead; export its reviews and import them into the local workspace to hand decisions to agents. Browser-local drafts are not account sync, a shared queue, or a backup. Check the dashboard's storage-mode notice before reviewing.

The public seed and canonical runtime catalogue describe only public artwork and sanitized production metadata. Private review comments, supplied reference photos, generation sources and working candidates belong in the local workspace/archive. Never place that workspace under `exercise-guides/`, `dist/` or a hosting output folder.

## One exercise, one version, one decision

1. The coordinator assigns a disjoint batch, normally six related exercises. Read the private tracker and claim the actual work before changing files. The private tracker is authoritative for requests, decisions, coordination and releases; this workspace is an asset authoring queue, not a second feedback backlog.
2. The generator reads the saved brief, exact requested variation, approved identity references and existing findings. New images become a content-hashed candidate version. Approved versions remain intact.
3. A different agent audits that exact candidate fingerprint, including both full poses and enlarged hands/joints. Rendering checks and technique review are separate findings.
4. The owner reviews the animation, individual poses, reference, audit and previous approved version. Approve or request a precise correction for that version. Another candidate starts unreviewed; earlier approval does not transfer.
5. The coordinator packages an approved version, tests it on dev and records the exact integrated hashes. Image approval, integration approval and production release approval are separate events. Neither an auditor nor a generator may invent owner approval or publish to production.

Use [the coordinator instructions](coordinator.md), [generator instructions](generator.md), [audit instructions](auditor.md) and [visual specification](visual-spec.md). Copy [the fresh-chat handoff](templates/batch-handoff.md) for each batch. Record audit results using [the audit template](templates/audit.json).

## Concurrent work

Read the current record revision before each mutation. Each exercise has one current claim; workers own separate exercise folders. Claims are coordination, not an excuse to ignore the private tracker. Commands reject stale revisions; on conflict, reread the latest record, compare changes and coordinate before retrying. Do not force a stale record over newer approval or another worker's audit. Keep a short next-action handoff when stopping.

The CLI supports `list`, `claim`, `release`, `candidate`, `audit`, `references`, `export` and `import`; run it without a command or with `--help` for the implemented argument contract. Claiming a known app exercise that has no artwork creates a queued record with no versions and no approval. Candidate registration requires a current claim and saves the generating worker on the version itself; releasing a claim does not erase that provenance. Generation/audit commands do not approve artwork or release it. Import is for explicit review decisions on already registered versions; it cannot register candidate images, rewrite audits or change public implementation pointers. Use the candidate command to bring new assets into the workspace. Imported decisions must preserve exact version fingerprints and immutable asset metadata. Keep private exports out of public commits.

To attach private supplied reference images locally, create a private JSON map from exercise ID to absolute PNG/WebP path, then run `node scripts/pose-review.mjs references --file reference-map.json`. The store copies registered reference images into its private workspace. Do not commit the map or image copies. Missing references remain visible rather than being marked verified.

The first candidate for a new exercise requires `--brief FILE`; start from [the brief template](templates/brief.json). Supply its constraints, exact references and generation provenance. Later revisions can inherit constraints/references, but should still provide the actual generation prompt and source hashes. The store saves that payload privately under the version's `generation.json` and keeps the supplied frame masters unchanged.

Exports archive review history. Import transfers the latest explicit decision per exercise onto matching registered versions; it preserves canonical history and does not trust imported history as new approval evidence. Use the exported archive itself when auditing earlier browser decisions.

## What is still a human decision

AI audits can flag visible errors and compare against documented references. They do not provide professional exercise technique clearance. Missing or conflicting references must stay visible. A move that cannot be explained accurately with two poses needs an owner decision about another pose or camera angle and a corresponding renderer change; the current player supports exactly two frames.
