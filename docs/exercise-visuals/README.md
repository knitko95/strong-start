# Internal exercise visual references

Reviewed **November 13, 2026**, against development source `b89ab5c`.

The index covers **320 catalog exercises, 92 warm-up/stretch guides and 12 cardio types mapped to 67 app labels**: **424 entries**. Each entry has at least one visual reference. Files stay in the public repository outside the member interface; the app does not load or package them. Reference links and original research notes only; no third-party media files are redistributed.

| Browse | Contents |
| --- | --- |
| [Catalog](catalog.md) | All 320 catalog exercises, with stable app IDs |
| [Warm-ups and stretches](guides.md) | All 92 named guides |
| [Cardio](cardio.md) | 12 movement types and all 67 labels |
| [Source provenance](sources.md) | Exact media/page links, credited creators, publisher selection and inspection status |
| [Gaps and conflicts](gaps.md) | Missing formats, related variants and excluded mismatched links |
| [Written technique library](../exercise-technique/README.md) | Setup, execution, alignment and common faults |

## Coverage and interpretation

| Reference category | Entries |
| --- | ---: |
| Video: same-labelled movement | 187 |
| Video: related movement or component | 233 |
| No accepted full video | 4 |
| Static exercise photo/illustration | 198 |
| Video poster instead of exercise photo | 221 |
| Animated GIF preview | 3 |
| No accepted still/animation | 2 |

**Same-labelled movement** means the source title, exercise-specific written section or documented naming equivalence identifies the requested movement. This is a reference-discovery classification, **not full visual validation of the exact variant or proper form**. **Related-only** means a difference remains in equipment, load, support, grip, direction, posture, tempo or sequence; some references teach only one component. Read the boundary at each entry. **Not-found** preserves an actual format gap. Cardio labels share movement-type references; their prescribed pace/duration is not individually researched.

An **image** is a publisher exercise photo or illustration. A **video-poster** is platform thumbnail artwork; it can contain text or a starting pose and is not a pose sequence. An **animated-image** is a GIF preview, not a full narrated video. Counts describe entries, so a reference reused by multiple entries is counted more than once here. The directory contains **615 unique media URLs** from **283 source pages** and **20 publisher groups**.

## Research and credibility checks

The search combined the existing 262-URL technique source inventory with original publisher exercise indexes, clinical-library samples and targeted uncommon-variant searches. Selected sources include professional education organizations, clinician-led libraries, equipment manufacturers and identified strength coaches. Commercial editorial sources and original coaching methods have narrower authority and explicit limitations in [publisher provenance](sources.md). Popularity, a matching title or a successful HTTP request alone was not treated as form validation.

For hosted videos, public provider metadata was checked for title and credited channel. The origin page and actual creator are stored separately: for example, Tony Gentilcore's TRX article embeds a clip credited to Testosterone Nation. 171 selected stills/previews received an identity check using temporary contact sheets or sampled GIF frames. No screenshots or downloaded media are committed. Four direct publisher video files returned HTTP 200 with video content types; this is a link check, not playback review.

**Full video playback, frame-by-frame movement analysis and professional technique approval have not been completed.** Provider metadata can remain available when playback is restricted. Links can change, require cookies or be region restricted. This library supports internal coaching/animation research; it does not certify the demonstrations or replace individualized instruction.

## Conflicts and remaining gaps

- Thirteen Physitrack landing-page labels disagreed with the linked Vimeo titles, including “March on spot” pointing to stationary cycling. Those video/preview pairs were excluded rather than silently relabelled.
- Rehab Hero's Low Cable Fly page embeds a clip titled Cable Chest Press; that clip/poster association was excluded. Different pages sharing the same open-book title also use different body positions; the side-lying reference is selected explicitly.
- The TRX anti-rotation entry links the clip embedded in the article used for the [written setup resolution](../TRX-ANTI-ROTATION-2026-11-13.md). Its motion remains unreviewed; the written setup finding does not imply video approval.
- Marching entries use an inspected standing-march animation because the accepted preview's full video metadata was unavailable. Cross-body shoulder stretch has an AAOS illustration, with no accepted full video. Peterson step-up and kneeling shin stretch have direct video links but no accepted still image.
- Related variants remain visible in [the gap list](gaps.md), including specialized machines, BOSU/TRX adaptations and multi-step throws. They are not silently counted as individual exercise validation.

## Structured files and maintenance

[entries.json](entries.json), [media.json](media.json), [sources.json](sources.json), [publishers.json](publishers.json), [coverage.json](coverage.json) and [excluded.json](excluded.json) preserve the mapping and evidence. Media IDs are stable URL hashes; source IDs are page-URL hashes. Existing NASM and technique references remain intact in the [ongoing register](../EXERCISE-SOURCES.md).

When replacing or adding a reference, verify the original page, creator and full target setup; record the date, known differences, inspection method and link status. Preserve conflicting evidence. Do not upgrade a relationship or inspection status merely because a title or URL responds. These files establish no media-reuse permission or publisher endorsement.

Run `node scripts/check-exercise-visuals.mjs` and `node scripts/check-internal-technique.mjs` from the repository root. No app accounts or database mutations are needed.
