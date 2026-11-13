# Internal technique research: November 13, 2026

Requested scope: detailed form/technique research for every exercise, stored as public repository references outside the member interface. Implementation began from current development commit `7b763e9f94aba88b775d3d2644167e73fc57d994` in a separate checkout, preserving unrelated local edits.

## Result

The [reference library](exercise-technique/README.md) contains individual notes for 320 catalog exercises and 92 named warm-up/stretch guides, plus 12 cardio movement types mapping 67 app labels. Each entry includes setup, performance, alignment/range, breathing/pace, common mistakes where applicable, regressions, source associations and variation-specific limits. JSON equivalents retain app catalog IDs and historical NASM associations.

The [source directory](exercise-technique/sources.md) records 256 exact URLs, review date, checked topics, conflicts, scope and retrieval limits. Catalog reference relationships are 163 same movement, 156 related only and one unresolved exact suspension setup (TRX Anti-Rotation Press). Warm-up/stretch coverage is 41 same movement and 51 related only. These are research drafts and relevance counts, not professional technique certification. Detailed review limits and source discrepancies are listed in the library introduction.

No runtime instructions, animation, saved data, exercise ID/name, plan-selection logic, database, Auth, permissions or configuration changed. No third-party instructional media or source passages were added. The existing November 11 audit/inventory is retained; the ongoing source register links each affected entry to these notes.

## Verification and publication

Local verification passed:

- `node scripts/check-internal-technique.mjs`: all 320 catalog exercises, 92 guides, 67 mapped cardio labels, 257 source URLs, historical NASM associations, source-register links and document anchors.
- `node scripts/build-dev.mjs`: complete animation package, script/environment isolation, version metadata, 101 persistence/workout scenarios, demonstration lifecycle checks and six offline scenarios.
- `node scripts/build-production.mjs`: public production package built locally; nothing deployed.
- Both generated packages exclude `docs/`, and runtime source/service-worker files contain no import of the internal notes.
- `git diff --check` and intended-file review.

No new account, database, signed-in browser or physical-phone tests were run for this documentation-only change. These checks establish completeness, links and packaging; they do not establish professional technique approval or observed movement performance.

Development commit `219795b0b919efc791d4112778481f3c7ba06149` was pushed to `dev` and deployed successfully by Workers Build `b1c27403-c0fa-4486-b7cc-9f49caceac89` (completed November 13 at 17:46 UTC). The public repository reference was readable at that commit. HTTP checks at `https://dev.strongstart.app/` verified the exact commit in version metadata, matching build identity in HTML/service worker, Testing banner markup and the isolated development backend. The runtime files contain no internal-note reference. This verifies publication of the documentation candidate, not exercise technique or observed movement performance.

No production publication or database/configuration mutation was performed or is required for these references. This record and the feedback status are a documentation follow-up to the tested candidate; the reference content and app runtime remain unchanged.
