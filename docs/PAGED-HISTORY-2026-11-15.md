# Paged history and progress summaries: development review

Owner-authorized scope: paged history loading, accurate progress summaries,
multi-year synthetic tests and dev deployment. Production is not approved.

## Behavior and storage

All saved workouts remain in the database and device cache. Normal browsing
holds a 30-workout page (plus one pinned draft when needed), compact exercise
summaries and bounded graph samples. Raw sync baselines, unsent records,
conflicting versions and incoming pages stay in IndexedDB. A small state document
still preserves settings, progression and drafts. No state-key or exercise-ID
reset is used. Schema version 2 upgrades the existing IndexedDB database in place.

The existing dev delta protocol still transfers at most 250 changed rows per
page/batch. Initial synchronization streams the full history into the offline
disk cache once; this change does not add lazy network archival or retention.
Subsequent boots and browsing use cursor pages. The database schema/permissions
are unchanged; no additional Supabase migration is needed. The earlier
`20261115231939_incremental_workout_sync.sql` remains pending for production.

Scores retain the original metric rules, exclusions, current exercise cohort,
first-two baseline, latest-three median and equal weighting. Facts are rebuilt
when raw records change. Exact summary windows and chronological graph passes
work from disk; an old deletion can replace a baseline and change the cohort.
Graphs retain at most 600 selected exact calculated points rather than every
historical point. The app discloses sampling when used; the score is not sampled.

Full backups/recovery exports stream record serialization into JSON/Blob parts
and include off-page records plus unsaved live edits. Exported JSON can still
temporarily occupy memory proportional to file size. Pasted restores parse the
supplied JSON once, then replace disk records transactionally and assign fresh
IDs for authenticated restores. A browser without IndexedDB retains the prior
limited localStorage/full-memory fallback.

## Verification

- `node scripts/build-dev.mjs`: existing 108 persistence/workout regressions,
  environment/syntax/version checks, media lifecycle and 8 offline-shell tests.
- `node scripts/test-paged-history.cjs [URL]`: real Chromium IndexedDB at 1280px
  and 390px; 2,600 workouts spanning ten years. A second run with
  `SYNC_TEST_COUNT=26000` stresses ten times as many records. A frozen pre-change
  calculation reference checks eligibility, baselines, scores, selected graph
  values, experience/stall decisions and workout sequence. Fixtures include
  mixed units, partials, duplicate entries, changing measurement types, archived
  exercises and invalid/excluded sets. Both remote and local old-baseline
  deletions are checked. The suite also checks paging, incremental payloads,
  lost responses, offline drafts, storage failure with a full backup, stale tabs,
  sign-out/deletion cleanup and legacy JSON migration success/failure. Hosted
  mode requires the exact built HTML. No real accounts are signed in.
- `node scripts/test-history-migration.cjs`: real IndexedDB-v1 and legacy JSON
  upgrades preserve offline deletions, separate device/account conflicts,
  independent remote additions, a remotely deleted partial's unfinished effort
  and full recovery copies. Unbounded IndexedDB `getAll()` is prohibited.
- `node scripts/test-history-boundaries.cjs`: disk-backed workout/plan conflicts,
  edits during upload, disposable coach preview/cache cleanup, repeated offline
  recording, equal-time/mixed-case-ID ordering, invalid dates and unrelated
  sessions. After reopening/GC, the measured JavaScript heap was 2,937,684 bytes
  with 2,600 workouts and 2,950,268 bytes with 26,000; both retained 30 raw records,
  zero full-history baseline records and bounded charts. These are synthetic
  desktop Chromium observations, not mobile or production capacity guarantees.
- Existing History and Progress UI suites cover 1280/390/320px, light/dark,
  expected scores 122.5/110/120, search/filter, keyboard focus, details, read-only
  coach browsing, unit conversion, deletion and escaping. Account deletion UI
  checks include complete downloaded backups and cleanup at all three widths.

## Review limits

Progress refresh reads compact disk facts in two passes, so its work still grows
with history size; retained raw history memory does not. First synchronization,
one-time legacy JSON parsing and explicit backups can take longer with very
large histories. Disk quota/eviction, physical iPhone/Android behavior, actual
OAuth/member cross-device sessions and mass-user concurrency remain unverified.
Browser RPC transport is synthetic; the existing RPC's database/role tests are
separate. Do not treat these checks as a live security or load certification.

The development-only candidate must be reviewed before any main push,
production deployment or production database/configuration changes. Other
concurrent dev features are not approved for release by this request.
