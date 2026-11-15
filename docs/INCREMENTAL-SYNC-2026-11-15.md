# Incremental sync and IndexedDB: development verification

Authorized scope: incremental sync, IndexedDB, several years of synthetic
history testing and dev deployment. Production release is not approved.

## Candidate and migration

The candidate starts from dev `55bf7977`, integrates main ancestry and concurrent
dev work, and changes persistence/sync, checks and related documentation only.
The original dirty checkout is preserved. Exact final commit and hosted
deployment evidence are recorded in the private tracker and final handoff.

Migration: `supabase/migrations/20261115231939_incremental_workout_sync.sql`.
Applied only to `strong-start-dev` (`gvyfgqhgqnfmtoytqpeo`). It adds row revisions,
indexes, guarded delta RPCs and compatibility triggers. No roles, approval rules,
Auth settings or production configuration change. An approved production release
must apply this migration before its matching frontend.

## Verification

- `node scripts/build-dev.mjs`: syntax, environment isolation, version metadata,
  existing workout/persistence regressions and offline shell checks.
- `scripts/test-incremental-sync.sql`, connected Supabase tool on dev only:
  2,600 workouts spanning ten years at five weekly workouts, each with six
  exercises and four sets. Fixture identities and records roll back. Tests cover
  250-record bootstrap pages, untouched historical rows, single-workout edits,
  revision races, tombstones, failed-write rollback, legacy snapshot clients,
  coach deferral/application/retry, denied direct writes, account isolation,
  unapproved/disabled callers and anonymous denial.
- One SQL observation: unchanged delta response 154 bytes / about 4.1 ms server
  execution; state-only save about 1.5 ms. These exclude network/Auth/concurrent
  load and are not capacity or service-level promises.
- `node scripts/test-incremental-storage.cjs [optional hosted URL]`: real
  headless Chrome IndexedDB at 1280px and 390px with synthetic RPC responses.
  Checks include ten-year history reload, changed-record-only device writes,
  upload batches and paged downloads, remote edits/deletions, zero-workout
  settings saves, one-record edits, lost responses, offline reload, active draft
  durability, storage failures, stale-tab rejection, cleanup and legacy migration
  success/failure. Hosted mode compares exact built HTML before exercising it.

Security advisors retain intentionally hidden role tables, the existing password
protection warning and authenticated definer RPC warnings. The new commit RPC
intentionally runs with elevated privileges to perform guarded atomic writes:
it derives the account from Auth, checks approval/revision, holds the profile
lock and bounds batches. It accepts no target user ID; public/anonymous EXECUTE
is revoked and its search path is empty. No broad policy or write grant was
added to silence the [definer advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Limits and release boundary

Browser RPC responses are synthetic; actual database behavior is tested
separately using database roles. These checks do not establish real Google
sign-in, real-member cross-device sessions, physical iPhone/Android speed,
mass-user concurrency or storage-eviction guarantees. All history remains in
memory for app calculations; large history rendering and recovery copies still
consume memory/disk. Initial import/download transfers full history once.
Tombstones remain for long-offline clients. Browsers without IndexedDB retain
the limited localStorage fallback. Close older app tabs before reviewing.

No production migration, data, Auth/configuration, deployment or main push is
part of this work. Leave the tested dev candidate for owner review.
