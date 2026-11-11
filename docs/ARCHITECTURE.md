# Strong Start architecture and operations

Baseline review: November 11, 2026, production frontend commit `149f807bd8e67c7c95204157e07e33e1202763a7`. Environment operations below were updated after development setup at `2e4f071b7c4361cb387e5f14bfcbdd7ff76cd6b1`. Production database metadata came from `aybtxqsneywuqxzjwoek`; no production mutations were needed. Follow [AGENTS.md](../AGENTS.md) for the required dev-first workflow and explicit release approval.

## Runtime and deployment

The browser runs one HTML page with inline CSS/JavaScript. Rendering builds HTML strings and assigns them to `#app`, `#tabs`, and modal/timer containers. Delegated document click/input/change listeners dispatch using `data-action`. There is no bundler, dependency installation, application server, or router package. Development has a small Node build and checked-in syntax/environment checks; these do not replace application-flow tests.

`index.html` loads Supabase JS v2 from jsDelivr's UMD path and fonts from Google Fonts. The SDK follows the v2 major rather than an exact patch. The manifest/mobile metadata provides standalone/Home Screen presentation. Development now includes the public-file service worker described below; it is separate from account sync. Exercise media registries (`EX_PHOTOS`, `EX_MEDIA`) are empty: instructions are text and inline SVG muscle maps, not a shipped video/photo collection.

The public repository includes `.nojekyll`; no local `.github/workflows` directory exists. GitHub reports a successful generated **pages build and deployment** workflow (`dynamic/pages/pages-build-deployment`) for the reviewed `main` SHA: [run 42969162454](https://github.com/knitko95/strong-start/actions/runs/42969162454). This verifies the deployment route; the exact Pages settings screen was not inspected. Local/remote `main` matched during review.

Production is [knitko95.github.io/strong-start](https://knitko95.github.io/strong-start/) from `main`, with Supabase `aybtxqsneywuqxzjwoek`. Development is [strong-start-dev.pages.dev](https://strong-start-dev.pages.dev/) from `dev`, with Supabase `gvyfgqhgqnfmtoytqpeo`. Cloudflare runs `node scripts/build-dev.mjs`, which produces `dist/` and runs `scripts/check-environments.mjs`; only `dev` automatically deploys. See [environment configuration and release procedure](ENVIRONMENTS.md).

All implementation and testing happens on dev first. Present the verified candidate, migration list, and limitations for the user's explicit release approval before pushing/merging to `main` or making production database/Auth/configuration changes. Approval of development work is not release approval. Supabase is separately managed; a Git push neither migrates nor rolls back the database. Rollbacks also require approval.

The current source uses production only at the exact live origin/path. Other origins/paths, including localhost, select development, with prefixed localStorage keys and a test manifest/banner. The Cloudflare build forces development mode and removes production backend credentials from its output. `SITE_URL` uses the current origin/path for Google OAuth, email redirects, and invites. The test Google provider has its own OAuth client and hosted redirect; localhost redirects need their own test-project allow-list entries.

## Source map

Mobile layout uses a device-width viewport with `viewport-fit=cover`, viewport zoom restrictions, and `touch-action:pan-y` on the document and scrolling sheets. Browser accessibility overrides can still permit zoom. Safe-area insets protect all four edges; `--nav-height` shares the fixed tab bar's height and bottom clearance with document padding and the floating timer. Setup/focus views retain bottom safe-area padding while hiding navigation. Phone form fields have a 16px minimum font size to prevent focus auto zoom. Validate both narrow portrait and landscape layouts; browser emulation does not establish native iOS/Android safe-area or keyboard behavior.

Navigate by section/function names rather than depending on these approximate line anchors.

| Area | Entry points in `index.html` |
| --- | --- |
| Presentation | Top CSS; `COLORS`, `applyColor`, `bodySVG`, `musThumb` |
| Catalog/IDs | `LIB_RAW` (~544), `slugify`, `LIB`, `EX` (~872) |
| Equipment/limitations | `EQ_GROUPS`, `reqFor`, `hasEq`, `allowed`, `candidates` |
| Program structure | `TPL`, `DERIVED`, `SPLITS`, `SPLIT_DEFAULT`, `weekKeys` |
| Selection/timing | `generatePlan` (~1241), `ensurePlan`, `sessionSlots`, `fitSlots`, `finalize` |
| State | `defaults` (~1362), `loadLocal`, `persistLocal`, `save` |
| Progression | `target`, `suggestW`, `applyProgression` (~1501) |
| Accounts/access/sync | `initRemote`, `checkAccess1`, `onSignedIn`, `pushCloud`, `pullCloud` (~1583-1711) |
| Coach/invites/owner | `loadPeople`, `openPerson`, `coachSend`, `inviteCreate`, `acctSetDisabled`, `acctDelete` |
| Feedback | `FB`, `fbSend`, `loadInbox`, `markDone` (~2040) |
| Rendering | `render` (~2194), `renderToday`, `renderPlan`, `renderLibrary`, `renderHistory`, `renderSettings` |
| Setup | `SETUP_ORDER`, `setupSteps`, `applySetup`, `buildPlanFromSetup`, `setupAction` |
| Current workout UI | `renderPreview`, `renderFocus`, `fAction`, `renderGuide`, `gAction`, `cAction` |
| Timers | `startRest`, `tick`, guide timers, `warmClock`, `syncWake` |
| Compatibility | `migrate` (~3841) |
| Finish/events/boot | `finishWorkout` (~4042), event listeners, `boot` (~4266) |

`render()` routes the workout tab to `renderFocus`. The obsolete `renderWorkout` renderer and unreachable first-workout tour were removed during the dev UI cleanup. Some legacy event handlers remain; trace the active dispatcher before editing similarly named functions.

## Plan engine

The 320 pipe-delimited rows describe name, equipment codes, movement slots, plane, muscles, tier, mode, unilateral flag, and cue. Modes include loaded (`L`), bodyweight with added load (`B`), reps (`R`), timed (`T`), and power (`P`). IDs are name-derived slugs persisted throughout the app.

Equipment requirements are groups of alternatives: every group needs an available item. Selection combines equipment, experience, comfort, pain-area name filters, goals, jumps setting, equipment style, prior choices, and randomness. These are heuristic filters, not a clinical assessment. Preserve health wording/product decisions unless an approved change requires editing them.

Thirteen splits support two to five workouts weekly. Base `push`, `pull`, `legsA`, `legsB`, and `jump` slots combine into derived days. `fitSlots()` trims sets, pairs compatible supersets, reduces rests, and may remove smaller exercises to fit a time estimate. `finalize()` enforces shared-station rules. Optional post-lift cardio is outside the selected session length.

A started workout records its exercises, order, and pairings in `draft.shape` (`lockShape()`), and `dSlots()` rebuilds from that list. Sets, reps, and rest still follow Adjust, but a later re-fit cannot drop, add, or re-pair an exercise mid-workout; previously that could hide an exercise and leave its logged sets out of the saved workout. Reordering before the first set re-locks the new order. Drafts created before this change lock on their next logged set. The field is additive: no schema version change or migration.

Plans use six-week blocks. Progression lives per exercise ID in `state.ex`; targets use prior sets, rep ranges, experience, and easy/hard feedback. Equipment uses different load ladders/increments. Introductory weeks reduce sets, with an age-dependent extension for beginners. `finishWorkout()` counts checked positive-rep/seconds sets against per-slot `draft.planCounts` (plus any extra sets). Logs record `status`, `completed`, `planned`, `units`, and `updatedAt`. Partial sessions retain a paused draft and log ID; resume restores skipped/unfinished rows. Finishing replaces the same log. Per-exercise `progressBefore` snapshots and comparison with prior entries prevent double-applying progression on repeated saves. Complete sessions clear the draft. Weekly completion excludes partials and deduplicates workout keys; legacy logs remain complete because their original whole-session counts are unavailable. Coach activity totals count logged sessions, including partial effort.

Deliberate set edits update `draft.planCounts` to the retained rows, including any completed sets that cannot be removed. Skips preserve the requirement so resume restores unfinished work. Week-order reset uses a distinct action from exercise-order reset. Body-weight validation shares one parser and converted bounds across setup, profile edits, and weigh-ins; an invalid entry never clears the saved profile weight. These changes retain the existing JSON schema and need no database migration.

## Local state and sync

### Assigned-coach messaging on dev

`CM` owns account-scoped in-memory message summaries and unsent drafts, separate from `state` and workout drafts. `cmOpen`/`cmDraw` use the existing accessible modal host, inert background and focus restoration. The thread keeps the current tab/scroll/workout state and hides bottom navigation; visual-viewport sizing keeps the compact composer inside the visible overlay. Input grows to 120 pixels. A failed send retains its draft and request ID; unchanged retries are idempotent. Closing retains unsent text for that page session, while sign-out/deletion/account switching clears it and invalidates pending responses. Message drafts are not part of local backups or account sync.

Member-facing coach cards, coach feedback routing and post-workout coach actions are hidden for `AUTH.coach` accounts. `cmOpen` also guards against opening the coach's own member thread through a stale control; opening/replying to a client's thread is unchanged. This is a presentation rule, with no database permission or assignment changes.

The `coach_messaging` RPC supports summary/read/send/done/dismiss. It derives recipients from existing invite assignment, verifies both profiles and coach membership, serializes thread mutations and exposes no general client write grants. Reading and resolving are separate states. A read returns a bounded chronological page and full-thread reply status; seen-message cursors protect against a reply/dismiss consuming a newer message. `coach_plan_message` copies new assigned-coach plan notes without modifying atomic plan application. Existing assigned legacy feedback is retained in threads; unassigned history stays in the original tables. See [the messaging verification and migration record](COACH-MESSAGING-2026-11-11.md) for migration order, compatibility and verification limits.

| Item | Meaning |
| --- | --- |
| `strongstart_state_v3` | Local JSON `{state, logs, sync}`; current `state.v` is 6 |
| `state.settings` | Profile, units, goals, schedule, experience/comfort, pain flags, display/cardio preferences |
| `state.places`, `curPlace` | Per-place equipment/current selection |
| `state.block` | Program number/start, base plan slots, original picks, introductory easing |
| `state.ex`, `adj` | Per-exercise progression/per-slot overrides |
| `state.draft` | Session references, place, sets, feedback, guide/step/timer state |
| `logs` | Newest-first sessions; ID/date/block/week/entries and optional cardio |
| `state.weigh`, `coach`, `prevBlock` | Weigh-ins/preferences, coach note, previous-program snapshot |
| `strongstart_acct`, `strongstart_owner` | Remembered account/cache ownership |
| `strongstart_invite`, `strongstart_local_only` | Pending beta invite/retained local-only preference |
| `strongstart_hs_*` | Home Screen prompt/reminder/welcome preferences |

The keys above describe production. Development prefixes the app keys with `dev_`. Supabase manages its own project-specific Auth session storage. Do not copy/inspect tokens to establish documentation facts.

`save()` preserves the local `{state, logs, sync}` envelope and queues a save after 1.2 seconds. The optional `sync` metadata records the account owner, last shared snapshot, unresolved conflict, and latest conflict recovery copy. Existing `{state, logs}` saves and personal backups remain readable; state stays at v6 and the storage key is unchanged. No baseline is assumed for legacy copies: differing substantive device/account data is retained for review.

`read_account_snapshot()` reads state, logs, server revision, and deleted workout IDs in one database snapshot. `commit_account_snapshot()` locks the caller's profile, checks approval and the expected revision, then commits state, logs, deletions, profile name, and eligible coach acknowledgements in one transaction. Revisions, not client clocks, determine whether a write can proceed. Old direct table writes are denied, including column-level grants, so stale application versions cannot bypass this boundary.

Reconciliation compares the shared baseline, current device copy, and account snapshot. Plans/settings/progression/units/drafts are treated as one interdependent document. One-sided changes are adopted; divergent changes stop with **Review sync conflict** instead of guessing. Logs merge independently by ID; conflicting edits to the same log require a choice. The dialog preserves both versions, offers a copy/export, and stores the last recovery pair before replacing local data. Recovery is retained until the next resolved conflict, account switch, or sign-out. Sign-out remains blocked by failed or unresolved syncing.

`workout_log_deletions` remembers removed IDs; stale clients cannot restore them. An unfinished draft referencing a deleted partial log keeps its sets but receives a new history identity when finished. Explicit backup restore imports workouts with new IDs (and remaps draft references), allowing intentional restoration without weakening ordinary deletion protection.

Uploads are serialized and check account identity after every network await. Edits made during a request are reconciled against the submitted snapshot; they are never marked synced merely because an earlier request finished. The baseline and current data are persisted together. Device-storage failures stop further writes and preserve the warning; lost responses are recovered by reading the committed snapshot on retry.

Foreground visibility and online events retry syncing. Coach application occurs only on a clean shared snapshot with a plan and no active or paused draft. The server applies pending updates in ID order and marks them applied in the same transaction. A failed transaction leaves updates pending; a lost response does not apply them twice. New user edits during delivery are retained, with explicit conflict review if necessary. This is event-driven reconciliation, not continuous Realtime or field-by-field plan merging.

Coach preview exposes only supported plan edits (exercise IDs, set/rep/rest/recovery overrides, level, and note). `renderCoachSettings()` shows personal settings as read-only context; working-weight edits, workout recording, history deletion, program resets, and backups are unavailable in coach view. `coachActionAllowed()` and input/change guards prevent unsupported UI actions, while database RLS remains the authorization boundary. Previewing a different place changes only the temporary view. Sending still uses the existing `planCode()` payload; this cleanup does not expand backend permissions or add data fields.

`migrate()` upgrades older state; v4 requests renewed setup for older states while retaining some records, and v5 preserves legacy split preferences. New migrations should be compatible and tested. Version 6 adds `weightUnits`; `normalizeLogs()` tags legacy logs with their source profile unit and preserves their existing completion status. All numeric weight fields are converted by `changeUnits()`; log units are normalized before cloud/local merging, restoring backups, and coach viewing. Free-text historical notes retain their explicitly written units. Earlier incorrect switches cannot be inferred.

Paused setup records an additive `setup.savedSettings` snapshot. `save()` and Continue reconcile later Settings changes into the wizard answers while retaining unfinished wizard-only answers. Older checkpoints compare against the default profile on their first reconciliation. When saved Settings supply goals, places, level/comfort and a valid schedule for an existing plan, the changed checkpoint is retired and `onboarded` becomes true; plan, progression, logs and draft are retained. Equipment editing defers this until outside the equipment screen. An early quick-setup checkpoint still requires its equipment/experience/limitations flow before a plan exists. No schema version or database migration is required.

## Database structure

The baseline eight public tables had RLS enabled. Development adds the RLS-protected deletion table below. Auth identities live in managed `auth.users`. This is structural documentation, not an export of people's data.

| Table | Key/data | Purpose |
| --- | --- | --- |
| `profiles` | `id` -> Auth user; email/name, last_seen, approved_at, invited_by, disabled_at | Profile/approval/disable status |
| `app_state` | `user_id`; JSONB state; updated_at, saved_at, server revision | Latest whole state |
| `workout_logs` | Composite `(user_id,id)`; date, JSONB data | Completed sessions |
| `workout_log_deletions` | `(user_id,id)`; deleted_at | Prevent stale workout resurrection |
| `plan_updates` | Identity id; user_id, created_by, JSONB update, created_at, applied_at | Coach update queue |
| `coaches` | `user_id` -> Auth user | Coach membership |
| `app_owners` | `user_id` -> Auth user | Owner membership |
| `feedback` | Identity id; nullable user_id -> profile, kind/tag/message/context, read_at/done_at | App/coach inboxes |
| `invites` | UUID id; unique code, creator/name/expiry/use/cancel fields | Single-use beta access |

Messages are constrained to 1-4000 trimmed characters; context fields also have limits. Invite names are at most 80 characters; default expiry is 14 days.

Auth-user deletion cascades through core account records. Feedback's profile reference becomes null; `admin_delete_account()` first removes coach messages and clears retained app-feedback workout context. Invite `used_by` and profile `invited_by` become null where configured.

### Authorization to preserve

- Members read their own state/workouts; coaches read across accounts. Members save through the guarded revision-checked RPC; direct state/log writes are revoked. Workflow-table restrictive policies also require `is_approved()`.
- Profile reads allow self/coach/owner. Client inserts allow id/email/name/last_seen; updates allow email/name/last_seen. Approval/inviter/disable columns are excluded. RLS-only review misses this protection.
- Feedback reads allow self or the appropriate inbox role. Inserts are limited to message/context columns; `user_id` defaults to `auth.uid()`. Inbox updates are limited to `read_at`/`done_at`.
- Invites are created by the coach-only RPC. Coaches read their own and update only `cancelled_at` on eligible unused rows.
- Coaches insert plan updates as themselves using only user_id/created_by/update columns. Clients cannot prefill applied_at or update acknowledgements directly. The atomic save function acknowledges only the authenticated recipient’s updates after applying them. Deletion records are readable only by their approved owner.
- `coaches`/`app_owners` have no client row policies. Small `SECURITY DEFINER` functions read them with an empty search path. No-policy notices do not justify making role tables public.
- Coach and owner are separate memberships. Owner membership alone does not grant coach access or beta approval: `is_approved()` explicitly exempts coaches, and the UI loads the people list through the coach path. Do not assume the roles are interchangeable.
- Reviewed definer functions check callers where needed. They are not all interchangeable with invoker functions. `coach_people()` is security invoker and relies on caller RLS.

### RPCs and migrations

`account_status()` returns `ok`, `disabled`, or `none`; `is_approved()`, `is_coach()`, and `is_app_owner()` support access checks. `is_staff(p_user)` protects account management. `coach_people()` returns activity summaries. `create_invite(p_name)` checks coach membership; `redeem_invite(p_code)` locks the row and checks expiry/cancellation/use. `admin_set_disabled(p_user,p_disabled)` / `admin_delete_account(p_user)` require owner membership and reject staff/self targets. `handle_new_user()` is the profile trigger function, not executable by ordinary clients.

Seven remote migrations were recorded:

```text
20261111010009 strong_start_core
20261111010028 lock_down_new_user_trigger_fn
20261111013126 profile_name_from_google
20261111021934 feedback_inboxes
20261111022004 is_app_owner_no_anon
20261111025351 beta_invites
20261111031220 admin_disable_delete_accounts
```

These seven SQL migrations are now checked into `supabase/migrations/` with their original version IDs, matched in the development database. The historical account-specific owner assignment in `feedback_inboxes` was omitted from the portable file; staff provisioning is separate. Schema parity was checked during dev setup. Do not replay these migrations against production, where their versions are already recorded. New migrations must be tested on dev and reviewed in the approved release before production application; recheck current migration history before each release.

## Verification and troubleshooting

### Self-service deletion (dev, November 11, 2026)

Migration `20261111195538_self_service_account_deletion.sql` adds `delete_my_account(p_confirmation text)`. It derives the target exclusively from `auth.uid()`, requires the exact confirmation `DELETE`, rejects staff via the trusted role tables, and checks the JWT session ID against a live `auth.sessions` row owned by the caller and created within ten minutes. Refreshing a token does not count as signing in again. Anonymous/public execution is revoked. No new table or column grants are added. This guarded definer RPC needs elevated privileges to delete the caller's Auth row; its search path is empty.

The function takes the profile lock used by account commits, removes coach feedback, clears app-feedback workout context, then deletes the Auth user in one transaction. Existing foreign keys remove profile/state/logs/tombstones/plan updates/sessions and null retained app-feedback profile links. Used invites retain `used_at` and cannot be reused. Existing tokens can remain cryptographically valid, but absent approval/profile rows deny snapshot commits and restricted data access. The frontend suspends persistence/sync during deletion, waits for in-flight sync, and clears account storage after success, even when local Auth sign-out reports an already-deleted user. A failed or ambiguous deletion response preserves the device copy; reconnect checks reconcile deletion. A current connected dev client with an established account sync clears its copy when no snapshot and `account_status()='none'` confirm removal. Offline devices cannot be remotely erased; external backups remain outside app control.

Run `node scripts/test-account-deletion.cjs` after building (optional hosted URL argument) for synthetic browser RPC checks, and `scripts/test-account-deletion.sql` against development only for rolled-back database fixtures. See [the deletion verification record](ACCOUNT-DELETION-2026-11-11.md) for checks and release scope.

See [AGENTS.md](../AGENTS.md) for build/local-server commands. Serve `dist/` to test the isolated development build; the current source also routes localhost to development. Use synthetic fixtures in the test database and verify hosted dev before requesting release approval. An offline fixture can disable the SDK in its served test copy, but label those checks as local-only. Do not commit fixture bypasses into the application or use production data for tests.

| Change | Relevant checks |
| --- | --- |
| Setup/selection | Fresh/partial wizard, v4/v5 state; different goals/levels/places; missing equipment; valid slot IDs and requirements |
| Workout/progression | Preview doesn't start; logging/rest/skip/undo; per-side/timed work; pause/reload; partial-set finish and next target/history |
| Saving/auth | Reopen/account switching; offline/reconnect; failed/partial upload; pending save on sign-out; simultaneous devices |
| Coach/owner | Deny unauthorized RPCs; preview doesn't save; intended payload only; draft deferral; staff/self management denied |
| Invites | New/approved/disabled caller; one-use concurrency; expired/cancelled/used codes; profile edits don't grant approval |
| Feedback | Correct recipient/context; column restrictions; read/done updates; no real test messages |
| Presentation | Phone/desktop; light/dark/colors; keyboard/labels/modal focus; long names; actual-phone Home Screen/timers |
| Release | Exact-SHA Pages success, live changed flow, console/network errors; database verified separately |

For sync problems, identify account/cache owner, draft, local/cloud timestamps, queue, and errors without exporting private payloads. Do not start by clearing storage. For access issues, check status/approval/provider, RLS, and grants before changing code. For backend defects, inspect relevant logs/advisors before schema changes; do not copy personal logs into this public repository.

Read-only `pg_policies`, `information_schema.column_privileges`, and `pg_get_functiondef()` queries help structural review. Privileged connector access does not prove client RLS behavior; role tests need a controlled isolated setup. Advisor findings/open work are in [the review](REVIEW-2026-11-11.md).

## Regression checks added November 11, 2026

Run `node scripts/test-persistence.mjs` for synthetic VM checks covering unit migration/conversion, partial completion/resume, upload draining/failures, sign-out, local-storage failure, and coach guards. `--fixture` writes an ignored local-only browser fixture under `test-results/fixture/`; it strips the SDK only in that fixture and must never be deployed. Run `node scripts/build-dev.mjs` separately for syntax/environment isolation. No database migration is needed for these JSON metadata changes. Offline app-shell reopening is covered by the new worker tests and browser checks described below. See [the sync verification record](SYNC-REVIEW-2026-11-11.md) for development-only cross-device and coach-save changes, database tests, and release requirements.

## Offline shell, dialogs, and shorter setup — November 11, 2026

`sw.js` caches an explicit allowlist of public HTML, `offline.js`, manifests, icons, and the existing Supabase SDK. Installation requires all required files, including the SDK. Navigation and listed static files are network-first with a four-second fallback to the cached copy. Auth/API responses, non-GET requests, and unrelated paths are never cached; navigation with query parameters is not stored. Cache names include the full app scope, and activation removes only that scope's old shell versions. Updates do not call skipWaiting or reload active workouts. Increment the shell VERSION when changing its cache contract. `scripts/build-dev.mjs` copies both scripts.

`offline.js` checks readiness through worker messages, exposes it in Settings, repairs missing public files on request/reconnect, and displays an offline notice. This is distinct from account sync; local account ownership and all server authorization remain in the existing app. A previously signed-in account can use its device copy during an outage. A first-time browser still needs its online sign-in/plan load. Cache eviction, separate Home Screen storage, and real-device background behavior remain platform constraints.

`modal()` provides a named dialog, initial focus, inert background, and retained focus through dialog redraws. Global Escape/Tab handlers close/trap focus; `closeModal()` restores the original or equivalent opener after callers rerender. Confirmation dialogs focus Cancel initially. No zoom settings were changed.

New setup drafts carry `a.quickSetup:true`; existing drafts have no marker and retain their full flow. Quick setup has eight screens, requires confirmation of each place's equipment and explicit experience/comfort/limitations answers, and defers display and detailed cardio preferences. Early pause keeps a checkpoint with no generated block. Plan generation occurs after the schedule screen. New-user defaults use a walking warm-up and no extra cardio; first-workout guidance appears on Today. This is additive JSON metadata, with no new database migration.

Run `node scripts/build-dev.mjs` for the combined persistence/onboarding and offline worker checks. Browser verification covers phone-width onboarding, saved setup resume, dialog keyboard behavior, and reopening/logging/reloading with the app server stopped. Worker tests cover total network failure including SDK fallback and cache exclusion. These do not establish physical iPhone/Android or assistive-technology compatibility.
