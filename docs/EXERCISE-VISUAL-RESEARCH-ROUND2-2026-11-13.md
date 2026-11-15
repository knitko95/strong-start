# Exercise visual research: remaining 107 comparisons

Reviewed November 13, 2026 against development baseline `848cf3e`.

The [second-pass audit](exercise-visuals/research-round2.md) records a source-specific disposition for all **107** comparisons left related after the first follow-up. **28 gained configuration-specific support; 79 remain related**, with the unresolved setup, sequence, access or provenance difference recorded individually. The full 424-entry library now has 158 configuration-supported references, 187 earlier same-labelled discovery entries and 79 comparisons. Every entry retains a video link; two still-image gaps remain.

The new reference graph adds 26 video URLs and 24 provider posters, reaching 755 media URLs from 437 source pages and 56 publisher groups. All preceding 705 media references remain associated, including replaced comparisons. The historical 262 technique sources and NASM associations remain unchanged. The [candidate ledger](exercise-visuals/research-candidates.json) contains 649 video URLs; the [retrieval ledger](exercise-visuals/research-pages.json) records 458 public requests, distinguishing ordinary page requests from published watch-page details.

## Findings and limits

New evidence includes manufacturer machine demonstrations, a university strength educator's standing cable leg curl, a physiotherapist's kneeling band pulldown and original clinical/coaching exercise sources. Publisher context and qualification evidence are recorded in [source provenance](exercise-visuals/sources.md). Publisher-reported credentials are not a renewal/licensing audit, and team credentials are not assigned to unnamed models.

Two earlier restrictions were corrected explicitly: the catalog heel-elevated dumbbell squat does not require a goblet grip, and the catalog hanging windshield wiper does not require bent knees. The internal notes choose those variants/regressions; their differences from the filmed references remain recorded. The SATS box-jump reference supports same-leg takeoff/landing, while the catalog step-down exit remains unreviewed. OPEX's two-foot landing instruction is retained as a rejected comparison for that target.

The audit preserves unresolved differences including low versus eye-height band anchors, frontal versus cross-body cable pull, front versus rear BOSU support, handle-held versus bear-hug sandbags, retained versus transferred/released balls, palms versus forearms on a wall and pedal steppers versus moving stairs. It also records redacted/restricted Vimeo access and reversed wrist flexor/extensor labels in a clinic description. A credible source can still demonstrate a different exercise.

All original first-pass decisions remain in [research.json](exercise-visuals/research.json) and [research.md](exercise-visuals/research.md). The latest audit preserves each previous selection, exact source URLs and candidate IDs. The original 14 source-card mismatches remain excluded.

Published descriptions, public preview stills, decoded public-publisher samples and explicitly identified visible-player positions support configuration checks. **Full continuous motion, narration, every repetition, individual suitability and professional technique approval remain unreviewed.** No third-party instructions, screenshots or video files are redistributed; only reference links, metadata and original research notes are committed. No access gate was bypassed.

## Validation and publication

The existing visual checker was extended to validate all 107 latest dispositions, historical decision retention, previous-reference retention, source/candidate links, honest player-position scope and JSON/Markdown agreement. Both `node scripts/check-exercise-visuals.mjs` and `node scripts/check-internal-technique.mjs` passed, as did `git diff --check`. Separate baseline comparisons confirmed that all 705 previous media remain, all 317 entries outside this pass are unchanged and the first-pass JSON is unchanged. Documentation-only development publication is recorded with the resulting candidate at handoff.

These are repository references outside the application. No runtime behavior, database migration or configuration change is included. Production publication is outside this change.
