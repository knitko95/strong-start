# Exercise visual-reference review: November 13, 2026

## Scope and result

Repository reference files only, based on current development source `b89ab5c`. The [visual library](exercise-visuals/README.md) indexes all 320 catalog exercises, 92 named preparation/recovery guides and 12 cardio types mapped to 67 labels. Exact media/page URLs, actual credited video creators, review date, publisher-selection rationale, format, relationship and inspection limits are retained. Existing written notes and NASM history are preserved.

The [coverage record](exercise-visuals/coverage.json) gives exact counts. Named references are distinguished from related components and missing formats. Still exercise images, video posters and animated previews are separate. The [conflict record](exercise-visuals/excluded.json) preserves 14 excluded page/video associations. No full video motion, professional form approval or equipment test is claimed.

## Checks and publication

Read-only inventory/JSON/Markdown/provenance checks, local-link checks, the existing technique integrity check and `git diff --check` passed. All 424 entries, 615 selected media URLs, 283 source pages and 20 publisher groups are accounted for. The current dev update `cdbbf29` was integrated before publication; it does not change this exercise inventory. Direct publisher file checks and platform metadata checks are recorded per media item. Documentation is excluded from app runtime packaging. No account, saved data, database, permission or configuration changes are part of this change.

Candidate `d8a7fe403e68a678e8014c2fcb7c9d07c5f05c98` was published to `dev`. Cloudflare build `0a5d1a19-f83b-4251-a1fd-8a8e82a616c7` succeeded on November 13 at 19:50:46 UTC. At `https://dev.strongstart.app/`, `version.json`, HTML and service worker returned HTTP 200 and agreed on build `dev--d8a7fe403e68-0f5a6537cb6e`. The test backend and Testing markup were present; production backend identifiers and internal-reference runtime imports were absent. Seven public repository reference files matched the local committed contents. The concurrent `6710c8a` update was preserved by rebasing the unpublished documentation commit before the successful push.

This verifies documentation publication and deployment identity, not authenticated app flows or video playback. No database migrations or configuration changes belong to this reference update. The production branch/site were not changed by this work; production publication remains unapproved. This verification-record follow-up changes only this document.
