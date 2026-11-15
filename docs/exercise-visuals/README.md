# Internal exercise visual references

Reviewed **November 13, 2026**. The library covers **320 catalog exercises, 92 warm-up/stretch guides and 12 cardio types / 67 app labels**: **424 entries**. Every entry retains a video reference; two still-image gaps remain.

These are **public repository references outside the app**. Runtime pages neither import nor package them. Third-party media are linked; reproduction permission is not established.

| Browse | Contents |
| --- | --- |
| [Catalog](catalog.md) | 320 exercises |
| [Warm-ups and stretches](guides.md) | 92 guides |
| [Cardio](cardio.md) | 12 types / 67 labels |
| [Latest 107-comparison review](research-round2.md) | 28 improved matches; 79 explicit unresolved comparisons |
| [First follow-up](research.md) | Historical 237-target audit and previous decisions |
| [Source provenance](sources.md) | Selected/retained media, creator credits and publisher rationale |
| [Gaps and conflicts](gaps.md) | Remaining variants, missing stills and exclusions |
| [Written technique library](../exercise-technique/README.md) | Internal setup, execution and form notes |

## Current coverage

| Video relationship | Entries |
| --- | ---: |
| Configuration supported by source-specific evidence | 158 |
| Earlier same-labelled discovery; not newly audited | 187 |
| Related / unresolved configuration | 79 |
| No video link | 0 |

**Configuration-matched** means exercise-specific prose and/or inspected original stills/player positions support the stated equipment, support and action. Read the limits: some clips support an identified phase, a particular machine or a catalog variant that differs from an internal-note regression. It does **not** mean every repetition or spoken cue has been approved. **Full continuous motion and professional technique approval remain unreviewed.**

The latest pass gives all **107** remaining comparisons a source-specific disposition; **28** gained configuration support and **79** retain explicit differences or evidence gaps. The [structured second pass](research-round2.json) preserves every previous selection and its relationship. The [first-pass audit](research.json) remains unchanged: 143 source-specific comparisons and 94 discovery/provenance screens at that earlier stage. Those historical depth counts are not a claim about the new pass.

**Same-labelled-movement** retains the earlier discovery classification for 187 entries outside this follow-up. **Related-only** retains equipment, load, posture, support, direction, sequence, access or publisher-provenance gaps. A title, successful metadata response or console view is insufficient to establish an exact exercise.

## Sources and inspection limits

The selected/retained graph contains **755 media URLs, 437 source pages and 56 publisher groups**. All 705 media from the preceding pass remain referenced, including replaced comparisons; the original 615 references and historical NASM associations remain intact. The new pass adds 26 video URLs and 24 provider posters. Still formats remain 198 exercise-photo references, 221 provider-poster references, three animation references and two gaps.

The [candidate register](research-candidates.json) retains **649 consulted video URLs** with exact source links, creator credits and access status, including unselected material. The [retrieval ledger](research-pages.json) records **458 public requests**; repeated URLs can have different access methods. A source can be readable through the web reader while a direct request is blocked. An unselected candidate is not an endorsement.

Public provider previews have unknown positions; no timestamps are invented for them. Public publisher videos sampled with a decoder have recorded sample times. Visible-player checks record displayed positions and do not imply continuous playback. Public metadata can be available while a standalone video is restricted. Original published descriptions were examined for setup differences; their full text is not redistributed.

## Conflicts and maintenance

The [latest audit](research-round2.md) records unilateral versus bilateral landings, goblet versus side-held loads, high versus low anchors, cross-body versus frontal cable pull, front/rear BOSU support, retained versus released balls, wrist naming errors and moving stairs versus pedals. Credible publisher identity does not erase an exercise-specific mismatch. The original 14 source-card mismatches remain quarantined in [excluded.json](excluded.json).

The [TRX anti-rotation setup resolution](../TRX-ANTI-ROTATION-2026-11-13.md) remains intact. Written setup resolution is not full-video approval.

Structured files: [entries](entries.json), [media](media.json), [sources](sources.json), [publishers](publishers.json), [coverage](coverage.json), [latest dispositions](research-round2.json), [historical dispositions](research.json). IDs are URL hashes. Preserve sources, previous relationships and unresolved differences when adding later evidence.

Run `node scripts/check-exercise-visuals.mjs` and `node scripts/check-internal-technique.mjs` from the repository root. Documentation-only verification needs no accounts or database changes.
