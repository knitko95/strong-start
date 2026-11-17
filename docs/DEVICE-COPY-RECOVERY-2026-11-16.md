# Device-copy recovery: November 16, 2026

The boot guard previously stopped indefinitely when IndexedDB and legacy
localStorage both contained a saved state. Its displayed JSON included only the
loaded IndexedDB page, so it was not a complete newer-history backup.

The revised screen offers a full private download and an explicit choice to
continue with the current app copy. It does not guess which copy is newer or
merge older-only edits. A checked confirmation is required. Before continuation,
the unchanged older raw JSON is archived durably in IndexedDB metadata, scoped
to the current copy's owner. Only after that transaction commits is the matching
legacy value removed. Stale IndexedDB generations, intervening legacy writes
and failed archival stop continuation with both copies preserved.

Recovery downloads include restorable state/logs objects for current and older
copies, plus all five raw storage collections for full diagnostic recovery,
including off-page workouts, sync baselines, conflicts, pending writes and
staged changes. Backups exposes archived older copies until sign-out, account
replacement, deletion or browser-data removal. This recovery envelope is not
itself a personal backup to paste into Restore. Nothing is sent to an owner or
external service by the recovery screen.

Routine IndexedDB writes no longer retire localStorage. Completed imports may
retire only their original unchanged legacy value; interrupted migrations keep
it and can require the explicit recovery flow after restart. The schema/key,
workout IDs, saved drafts and cloud protocol are unchanged. No database migration
or hosting configuration change is required.

## Verification

- `node scripts/build-dev.mjs`: syntax/environment/version checks, 108 existing
  persistence/workout scenarios and 9 offline scenarios.
- `node scripts/test-device-recovery.cjs [URL]`: real Chromium at 1280/390/320px,
  95 off-page current workouts, a differing 96-workout legacy copy owned by a
  separate synthetic account, paused draft, full pending queue, downloaded JSON,
  explicit continuation, reload, owner-scoped archive and private-data cleanup.
  Failed archival and concurrent writes to either storage system preserve data
  and recover after reload. Unbounded IndexedDB `getAll()` is prohibited.
- Existing history migration tests pass IndexedDB-v1/JSON conflict migration,
  pending deletion, remote additions, partial identity and full recovery.
- Existing history boundary tests pass disk conflicts, upload edits, coach
  isolation, repeated offline saves, ordering and 2,600/26,000-record memory runs.
- Paged-history suite passes 2,600-workout desktop/phone calculation parity,
  deletion, account isolation, offline recovery and incremental sync behavior.

The paged-history test server now sends CSS with its correct MIME type so local
visual checks actually include the shared theme. Synthetic desktop Chromium
checks do not verify a physical phone, Safari downloads or the affected person's
actual saved copies. Production publication requires separate approval.
