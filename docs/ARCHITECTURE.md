# Strong Start architecture and operations

## Development character comparison

`exercise-guides/shared/characters.json` describes optional character geometry
and color textures independently of the accepted exercise library. The gallery
selector and separate `exercise-guides/character-lab.html` use the existing
renderer. The default anatomical character is unchanged. Selecting a model
preserves paused time, camera and the existing skeleton/equipment node matrices.
Model choice is page-session UI state and never enters profile or cloud state.
Candidate geometry is fitted to each accepted bind frame from its source inverse
binds; no animation, skeleton hierarchy or inverse bind is rewritten. Two fitted
geometries are cached, and the original body loads only when needed. Candidate
muscle highlighting is unavailable because the anatomical map is not validated
for that surface. See [the dated comparison](CHARACTER-COMPARISON-2026-11-13.md).

## Complete animation drafts on development

`exercise-guides/shared-guides.js` owns the workout/modal media surfaces and
lazily imports one persistent renderer from `shared/player.js`. Moving its DOM
canvas between a workout and a swap/review sheet preserves the character,
skeleton and GPU resources. Closing a media sheet restores the prior workout
selection and its playback preference. Ordinary workout instructions continue
to cover/pause the inline player. Media code handles public assets only; it
does not read or write account/workout storage.

`shared/manifest.json` includes all 320 strength IDs and the named guide/cardio/
recovery set. Entries remain development-only. Earlier schema-1 scenes are
retained; new schema-2 scenes reference one shared schema-1 rig setup plus
compressed motion, appended equipment nodes and a shared role map. Attachments
name an existing bone or become scene roots. All channels target the final node
indices. The original character, two bind fits, inverse binds and 55 joint names
are retained. Geometry/materials, downloaded bytes and bounded decoded maps are
reused; the persistent public asset cache pins the current library/character.

`animation-authoring/` holds editable recipes, frozen original setups, region
fields and deterministic exporters. New shapes use five content-addressed unit
geometries, instanced with transforms. `check-all-exercise-animations.mjs` checks
coverage, transitive hashes, byte lengths, motion/timing, quaternion norms and
original-asset preservation during the development build. See the
[authoring workflow](../animation-authoring/README.md) and
[scope and verification limits](COMPLETE-EXERCISE-ANIMATIONS-2026-11-13.md).

Baseline review: November 11, 2026, production frontend commit `149f807bd8e67c7c95204157e07e33e1202763a7`. Environment operations below were updated after development setup at `2e4f071b7c4361cb387e5f14bfcbdd7ff76cd6b1`. Production database metadata came from `aybtxqsneywuqxzjwoek`; no production mutations were needed. Follow [AGENTS.md](../AGENTS.md) for the required dev-first workflow and explicit release approval.

## Runtime and deployment

The browser runs one HTML page with inline CSS/JavaScript. Rendering builds HTML strings and assigns them to `#app`, `#tabs`, and modal/timer containers. Delegated document click/input/change listeners dispatch using `data-action`. The browser has no bundler, frontend dependencies or router package. On dev, a small Cloudflare Worker handles authenticated app-feedback delivery; static assets remain separately packaged. Development has a small Node build and checked-in syntax/environment checks; these do not replace application-flow tests.

`index.html` loads Supabase JS v2 from jsDelivr's UMD path and fonts from Google Fonts. The SDK follows the v2 major rather than an exact patch. The manifest/mobile metadata provides standalone/Home Screen presentation. Development now includes the public-file service worker described below; it is separate from account sync. Legacy video/photo registries (`EX_PHOTOS`, `EX_MEDIA`) remain empty. The new versioned `exercise-guides/registry.v1.json` links eleven existing IDs to reviewed rose-top 3D demos, enabled in development only. Text instructions remain owned by the existing catalogue/`exHowTo()`. The isolated loader imports model-viewer and a hash/version-pinned GLB on demand, cleans up on modal replacement/close, and falls back to the unchanged written guide. No account state, persistence schema or permissions change. The small loader/CSS/registry join the offline shell; models and the viewer bundle are not precached. See [scope and verification](EXERCISE-GUIDES-2026-11-11.md).

The public repository includes `.nojekyll`; no local `.github/workflows` directory exists. GitHub reports a successful generated **pages build and deployment** workflow (`dynamic/pages/pages-build-deployment`) for the reviewed `main` SHA: [run 42969162454](https://github.com/knitko95/strong-start/actions/runs/42969162454). This verifies the deployment route; the exact Pages settings screen was not inspected. Local/remote `main` matched during review.

Production is [strongstart.app](https://strongstart.app/) from GitHub `main` through Cloudflare Workers Builds, with Supabase `aybtxqsneywuqxzjwoek`. Development is [dev.strongstart.app](https://dev.strongstart.app/) from `dev`, with Supabase `gvyfgqhgqnfmtoytqpeo`. Development Workers Builds watches only `dev`, builds from `hosting/cloudflare-dev`, and packages isolated `dist/` output. Production Workers Builds watches only `main`, builds from `hosting/cloudflare`, and packages `dist-production/`. Both use the same shared Worker routing/runtime settings and cache/security rules; development adds noindex. See [development hosting migration](DEV-WORKERS-2026-11-11.md). See [environment configuration and release procedure](ENVIRONMENTS.md).

All implementation and testing happens on dev first. Present the verified candidate, migration list, and limitations for the user's explicit release approval before pushing/merging to `main` or making production database/Auth/configuration changes. Approval of development work is not release approval. Supabase is separately managed; a Git push neither migrates nor rolls back the database. Rollbacks also require approval.

The current source uses production only at the exact live origin/path. Other origins/paths, including localhost, select development, with prefixed localStorage keys and a test manifest/banner. The development build forces development mode and removes production backend credentials from its output. `SITE_URL` uses the current origin/path for Google OAuth, email redirects, and invites. The test Google provider has its own OAuth client and hosted redirect; localhost redirects need their own test-project allow-list entries.

The published [domain transition](DOMAIN-TRANSITION-2026-11-11.md) adds exact-root production recognition for `strongstart.app`, retaining the GitHub Pages paths during transition. Development output always forces test mode. `hosting/cloudflare` builds Workers Static Assets from the public-only `dist-production` directory; build tooling has its own pinned dependencies, while the frontend remains a plain static app. The domain and Git build connection are configured in Cloudflare; production Auth URLs are configured separately in Supabase. The source configuration does not create these connections. Explicit HTML handling plus an internal root rewrite keeps index.html responses usable for offline caching.

## Source map

History progress is derived on demand from the currently loaded `logs` by `historyData()` / `historyProgress()`. It does not persist scores or change account sync, roles, storage keys or schema. `histView`, `histArea`, `histQuery`, `histFilter` and `histExercise` are temporary UI state; all history browsing actions remain available in read-only coach preview. See [score definitions and limits](HISTORY-PROGRESS-2026-11-12.md).

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
| Feedback | `FB`, `fbSend`, `hosting/feedback-worker.mjs`, `hosting/feedback-core.mjs` |
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

### Workout presentation on dev

The workout header uses `fTop()` with a single row containing the exercise/superset count, group segments and the top-right menu; the brand is omitted. Segments count `fGroups(slots)` so paired stations are not double-counted, and warm-up/cool-down labels retain the same compact header. Regular exercise Up next hints are rendered only for the last displayed set; paired sets omit the repeated footer guidance and use the timeline plus uniform Log set/Ready controls; completed-set edits retain Save changes. `workoutPath()` renders separate A/B stops with distinct DOM IDs from `fPathSetId()`, independent completion/selection/current markers, and a shared rest after each available pair. Card headings use matching Set 1A/1B labels; the separate A/B strip is removed. These DOM IDs are not saved state, so old drafts require no migration. `markWorkoutPathArrival()` tracks only the page-session cursor, adding a brief arrival highlight when the actual step changes; `setupWorkoutPath()` restores the prior rail scroll and smoothly centers the new stop. Initial load, editing-only rerenders and reduced-motion preferences suppress the effect. No transition data is persisted. Rest screens omit the repeated duration and View/edit sets control; path navigation remains the editing entry and preserves the running deadline. Paired rest headers retain the count without the Superset label. `workoutPath()` retains its existing step IDs, current/selected separation, set editing and rest actions; the visible path uses compact numbered set labels and SVG stopwatches without durations. The rest screen retains its countdown. `workoutSetHint()` supplies the identical optional hint to both layouts. A noninteractive, aria-hidden sizing base in `.rest-entry-slot` matches the entry label, field and wrapped hint geometry; the timer is overlaid upward from that slot’s bottom. This keeps timeline/button coordinates stable without changing timer logic or reducing input targets. Exercise/rest logging and their main actions share one panel. `fMoreSheet()` groups the existing actions without changing their handlers. During a workout, `exInfo()` shows the existing cue, warnings, form tips and muscle/equipment details in a compact disclosure sheet; the library guide is unchanged. The retained inline model pauses under sheets and resumes according to the user's playback choice. This is presentation only, with no state schema, database or sync change.

Today and Plan share `renderPlanExercises()` for exercise targets and Adjust/Swap controls. Today’s disclosure lives only in `ui.todayExercises`, preserves expansion during rerenders, and displays `dSlots()` for a paused draft so its locked exercises/substitutions stay visible. The member’s Start button uses the existing `fbegin` warm-up flow directly; resume and read-only coach guards are unchanged. No saved-data or database change.

Today derives its completed-day card from the latest non-partial current-block log whose `completedAt` (or legacy `date`) falls on the device's local day. A current draft takes priority; `workoutCompletion()` supplies its set counts and `todayResumeNext()` describes its saved phase/exercise or the first unfinished partial slot without moving the workout cursor. Rest-day guidance applies only to fixed schedules with no draft or completion today. After completion, the quieter next-workout button uses the existing preview action; rest-day early training retains `fbegin`. Exercise counts come from the same adapted/frozen slots as the disclosure. Unread coach messages now precede Other workouts and keep the same open/dismiss handlers. No new saved fields, schema, permissions or backend calls are introduced.

### Workout sequence on dev

`nextWorkoutKey()` follows the latest advancing completion in the current block and current workout order, across program-week boundaries. A completion advances only when its key matches the recommendation before saving. New completed logs add optional `orderAdvanced` and `completedAt`; legacy completed logs without these fields use their original completion status/date. Partial logs never advance. This supports repeat cycles without a second mutable cursor and derives the same recommendation after reload, sync, history deletion or backup restoration. A user-changed order uses the current successor of the last advancing completed workout; a different split ignores keys it does not contain. `restartblock` sets optional `block.sequenceResetAt` to exclude earlier completions while retaining history/progression. New blocks naturally start at the first key.

Weekday labels now describe planned attendance separately from numbered workouts. `nextTrainingDate()` suggests today if selected and no workout has been completed today, otherwise the next selected day; it does not restrict Start. Flexible plans retain the same sequence. Today, Plan, preview, initial plan review, Settings order and coach message context share the numbered/recommended order. The old warning assigning specific adjacent workouts to specific weekdays was removed because that mapping no longer holds.

`finishWorkout()` keeps a resumed partial's original history date/ID but records its actual completion timestamp and program week. Weekly progress continues to deduplicate completed workout keys and exclude partials; program duration/targets remain based on elapsed seven-day weeks. Existing state v6, storage keys, plans, drafts, weights and logs are preserved. These optional JSON fields need no schema/key reset or database migration; existing snapshot RPCs store full log JSON. See [scope and verification](WORKOUT-ORDER-2026-11-11.md).

## Local state and sync

The development muscle map shares curved SVG geometry with exercise thumbnails and how-to diagrams. `musclePicker()` uses the existing accessible modal host; its grouped buttons and diagram taps both call `selectMuscle()`. Selection stays in `ui.musSel` and does not call save or cloud functions. The chooser actions are allowed in read-only coach preview. Weekly set calculations and primary/secondary exercise mappings are unchanged; no saved-data or database migration is needed.

### Assigned-coach messaging on dev

`CM` owns account-scoped in-memory message summaries and unsent drafts, separate from `state` and workout drafts. `cmOpen`/`cmDraw` use the existing accessible modal host, inert background and focus restoration. The thread keeps the current tab/scroll/workout state and hides bottom navigation; visual-viewport sizing keeps the compact composer inside the visible overlay. Input grows to 120 pixels. A failed send retains its draft and request ID; unchanged retries are idempotent. Closing retains unsent text for that page session, while sign-out/deletion/account switching clears it and invalidates pending responses. Message drafts are not part of local backups or account sync.

For the iOS Home Screen keyboard, `cmLockPage` freezes only the background page and retains its scroll position and existing inline styles. The backdrop remains full-size; `cmViewport` positions the sheet inside it using the visual viewport and the backdrop's measured top, so a WebKit viewport pan is not applied twice. Keyboard-open layout uses the full available height and a small composer inset rather than the Home indicator safe-area padding. The bottom tabs use display:none while messaging. `cmClose` restores the prior body styles and scroll position. Keyboard geometry is covered by simulated viewport tests, not a physical iOS keyboard claim.

The page lock is applied before the dialog receives focus. `cmSettleViewport` positions it immediately, again over two animation frames, and after a short settling delay so opening does not depend on an input focus/keyboard event. Closing cancels those callbacks and clears the previous sheet offsets. The initial-position regression test moves the backdrop after its first measurement without a resize or input event and checks that the sheet realigns itself.

After the owner clarified that the whole phone card was visible but lower than expected, the deliberate 64 px opening gap was removed at widths up to 600 px. Phone conversations now fill the visual viewport before and during typing. Their header respects the top safe area before the keyboard opens; desktop retains the original inset. Tests distinguish these intended layouts and cover a simulated iPhone status area.

The later screenshot showed the header down near the keyboard with the reply area obscured. The message dialog now passes layout classes and a before-focus callback to `modal()`, so its geometry is applied before any retained textarea focus can trigger native scrolling. The iOS Home Screen path pins the sheet to the visible top and uses the visual viewport height without adding its keyboard-pan offset again. Non-standalone viewport positioning is retained. Tests simulate a large standalone keyboard offset and inspect sheet bounds at the exact moment the textarea receives focus; this still needs physical-device confirmation.

Member-facing coach cards, coach feedback routing and post-workout coach actions are hidden for `AUTH.coach` accounts. `cmOpen` also guards against opening the coach's own member thread through a stale control; opening/replying to a client's thread is unchanged. This is a presentation rule, with no database permission or assignment changes.

The `coach_messaging` RPC supports summary/read/send/done/dismiss. It derives recipients from existing invite assignment, verifies both profiles and coach membership, serializes thread mutations and exposes no general client write grants. Reading and resolving are separate states. A read returns a bounded chronological page and full-thread reply status; seen-message cursors protect against a reply/dismiss consuming a newer message. `coach_plan_message` copies new assigned-coach plan notes without modifying atomic plan application. Existing assigned legacy feedback is retained in threads; unassigned history stays in the original tables. See [the messaging verification and migration record](COACH-MESSAGING-2026-11-11.md) for migration order, compatibility and verification limits.

The live-update extension publishes `coach_messages` to `supabase_realtime` without changing participant RLS or client grants. Each foreground account subscribes to INSERT and UPDATE only; payloads invalidate a debounced authorized RPC refresh rather than being trusted as conversation state. Subscription handles/timers are removed on hidden/pagehide/sign-out/account reset and re-created on return; failed channels retry with a 15-second foreground polling fallback. Account generation and read-request guards discard stale callbacks. Unchanged summaries do not redraw the app, and summary refreshes avoid redrawing active workout/preview or form inputs.

`peek` retrieves conversation history and receipt timestamps without marking it read. Quiet updates use `read` only when following the latest messages, and `peek` when reading older history. They replace the message-list content while preserving the actual composer node, focus/caret and scroll; New messages provides a deliberate return to the bottom. Gap pages are fetched after reconnect. The RPC only updates null read timestamps, preventing a read/Realtime feedback loop. The latest outgoing message renders Sent/Read; dismiss still marks read, by owner decision. See [live update checks](LIVE-MESSAGING-2026-11-11.md).

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

## Workout presentation follow-up — November 11, 2026

The remaining workout views share `.acard`, `.asection`, `aTop()` and `aFoot()` with the existing exercise/timer design. Preview, lists, exercise completion, cardio questions and completion retain their existing entry points and actions. The workout list and saved summary remain accessible dialogs using `modal(..., {sheetClass:'workout-sheet'})`, so background inertness, Escape, focus trapping, account guards and message actions stay in the existing modal system. Long previews use normal document flow instead of covering exercise rows with a sticky footer.

Superset introductions are a presentation of the existing `ex` step, not a new scheduler phase. The additive `draft.pairSeen` map is keyed by the pair's ordered slot IDs; **Start A** acknowledges it without logging any sets. A pair with already-logged sets bypasses the introduction, including older drafts with no map. Pair membership still comes from `dSlots()` and locked `draft.shape`. `fPairAction()` describes the scheduler's next destination, including unequal counts, skipped partners and disabled automatic rest; `fdone` still owns actual logging and timers.

The cardio check-in stores a pending `draft.guide.feelChoice`; **Continue** calls the existing feedback and advancement functions once. A selection can survive reload without prematurely changing cardio targets. These additive draft fields require no saved-state version/key change or database migration. The existing whole-document sync and coach save guards remain in force. See [the screen update verification](WORKOUT-SCREENS-2026-11-11.md).

## Guided navigation — November 12, 2026

`renderGuide()` uses the shared compact header/card/path components; `fTop()` accepts an optional phase segment array. Both phases use `guideSteps()` to flatten cardio parts into display/navigation steps without changing the underlying timed item or completion/logging model. `guidePath()` groups the continuous warm-up rail under Cardio and Warm-up moves; cool-down retains Cardio, Walk, Recovery (when planned), and Stretches. Both use `gstep` actions calling `gChooseStep(i,s)`. Cross-item selection delegates to `gChooseMove()`. Long visible labels are clipped within their stops; full activity names remain in the page heading and accessible labels. Header segments count the same flattened steps. The full cardio-part/move title sits above the card; timed guide card headings use Ready, Time left or Paused (side-switch gaps retain their instruction). No repeated section title is added. Each ordinary guided card always renders `.guide-next` below its primary button; its label comes from the next cardio part or guide item, the same first-working-exercise selection as `gFinishPhase()`, or Finish workout. It does not depend on remaining time. `guide.positions` is an additive map keyed by group, stable move key and selected title. It stores only the selected part, mode, paused remaining milliseconds and total; it never changes working sets or progression. `gStoreMove()` pauses and checkpoints before changing moves, using the checklist, pausing the workout or leaving through the workout list. Checkpoint selection preserves paused work; completed entries are cleared when returning from a checked-off list.

Timed preparation uses `mode:ready,end:null`. `gPrepareMove()` sends untimed rep-based items directly to `mode:reps` on initial entry, timeline selection, next move, optional-cardio choice, Back and legacy rendering. Rep targets remain display-only. Choosing Start cardio in `finq` calls `gAdvance()` immediately; repeat choice events are ignored after leaving `finq`. Subsequent cardio parts continue in `run`, with deadlines anchored to the previous deadline so `gTick()` can catch up after background time. Warm-up cardio starts with one Ready action. Selecting another part of the same running cardio in either phase retains `run`; paused selection retains `paused`. Crossing into another item uses the existing paused checkpoint path. Individual timed warm-up moves, the walk, recovery and stretches still wait at Ready. Choosing a cardio part before the initial start retains Ready. `gTick()` advances only running/gap timers and stops when a new move reaches Ready or its untimed rep target. Side gaps and cardio parts retain their durations. `gCompleteMove()` preserves the cardio effort prompt for both automatic and manual completion. Done advances one timed part or completes a rep move; duplicate Ready/Done actions in other modes are ignored. Paused time adjustment remains paused. `migrate()` initializes old checkpoint maps and converts only legacy preparation countdowns (including paused preparation) to manual Ready, retaining active/paused work and all completion maps. The state remains v6 with the same keys; no database migration is needed.

`gAdjustTime(sec)` changes the current cardio part's remaining countdown milliseconds, using the same sign convention as rest timers: positive adds time and negative removes it. It updates the existing total/remaining/deadline fields without changing planned phase durations or seeking across earlier parts. Removing the final seconds calls `gAdvance()` once; a previously paused timer remains paused if the next cardio part starts. Final completion still uses `gCompleteMove()` and the effort prompt. Accessible button labels say 15 seconds more/less. This corrects the earlier elapsed-position seek behavior behind the plus/minus icons in both warm-up and cool-down.

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
| `feedback` | Identity id; nullable user_id -> profile, kind/tag/message/context, read_at/done_at | Historical app/coach intake; stale-client compatibility |
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

## Editable warm-up loads — November 12, 2026

The additive `draft.rampSets` map stores separate `{w}` rows by slot/exercise ID and warm-up index. Older drafts initialize from their existing warm-up suggestion when shown. The warm-up card reuses the working-set weight control with a ramp scope; input/increment handlers write only to that map. `convertDraft()` converts these loads on unit changes, including saved previous-program drafts. The normal save/sync and coach guards remain in place. Ramp completion still advances only `rampDone`; it does not log working sets or influence progression. No schema/key change or database migration is required.

### Set selection on dev

Working-set path nodes select an optional zero-based `draft.step.i` instead of clearing `set.done`. Absent or out-of-range selections fall back to the first unfinished set (or last set when all are complete), preserving older drafts and set-count edits. Navigation retains entered values and completed counts; selecting a tile during rest preserves that timer; an explicit Ready, workout-list jump, skip, new set completion or workout end clears/replaces it. Saving a completed set returns to unfinished work in its group without logging it again, carrying weight forward or starting a fresh rest. Logging an unfinished selected set retains normal pairing, rest and completion rules. The index is an additive draft field; no schema or storage-key change is needed.

### Rest access on dev

The `frest` stopwatch nodes sit between working-set stops and show only the icon; durations remain in accessible labels and the rest timer screen. Paired moves have distinct A/B stops before each shared rest. A preview uses `step.restPreview` and optional `step.restSec` without starting a timer or altering settings/sets. `freststart` starts the existing rest timer; selecting another set leaves it running. Optional `draft.rest` stores `{pk,end,total,afterRound?}` independently of the viewed set, preserving the original rest destination across editing and reload. `fRestoreTimer` restores this record and accepts legacy `step.tEnd` timers. Timer adjustments persist the updated deadline/total. Expiry clears both timer records; an exercise editor keeps its selection, while the rest screen advances to the next unfinished set. Manual access does not change automatic-rest preferences or superset scheduling. No schema, storage-key or database migration is needed.

### Workout path on dev

`workoutPath()` renders alternating set/round buttons and rest clocks inside the exercise/rest card. Rounds derive from the existing frozen slot group and actual draft rows, including unequal set counts; absent partner rows are disabled in the A/B strip. The path does not create or mark sets. Completed stops use fill and accessible completion labels, without repeated checkmarks. A native horizontal scroller and two edge buttons retain readable target sizes; the selected stop is centered after rendering and arrows disable at the ends. Scroll and resize handlers update arrow availability; the resize observer disconnects on the next render.

Optional `draft.pathCurrent` snapshots the actual step before browsing, independently of viewed `draft.step`. Saving a completed row restores that position, including a running rest. Logging a new row, explicit workout-list navigation, skipping, or ending a rest clears the snapshot and follows the existing scheduler. Rest identity uses optional `afterRound` on the step/rest record so previewing an earlier rest does not mutate a different running timer. Expiry advances the saved cursor without replacing an active editor or unrelated rest preview. Older drafts infer the rest round from the next unfinished row; current and selected indices fall back safely after set-count edits. These are additive JSON fields, with no storage-key, schema or database migration.

### Demo-first workout and unrestricted swap picker — November 12, 2026

Exercise/rest views render a transparent `workout-demo` above the logging/timer card. `setupWorkoutDemo()` retains the same mount during same-exercise rerenders, including button increments and rest transitions, so the animation and camera do not restart. Missing/unreviewed/offline media collapses to the ordinary How to entry point. The registry and original GLBs are unchanged and remain development-only. The character uses transparent rendering with no floor shadow.

The media loader owns separate `workout` and `modal` surfaces. A modal pauses the underlying workout demo without changing its user-selected playback intent; closing restores that intent. Replacement/navigation cancels pending loads and removes the old viewer. How to retains the full instructions, muscle details and viewer controls. `scripts/test-workout-demos.mjs` validates lifecycle with synthetic model/DOM APIs; it does not validate WebGL or physical layout.

`ui.swap` holds transient picker state only. Suggestions share a movement and fit equipment/preferences; the next group shares primary muscles and excludes the movement group. Search and Browse all query the entire catalogue, with optional muscle/equipment filters, explicit detail/confirmation, existing pain cautions and equipment notices. The default in-workout scope is today only; Also update my plan makes it persistent. Coach preview uses the persistent-plan path and retains the existing save guards.

On a mid-exercise swap, optional `draft.completedSwaps` records the original frozen slot under a unique archive key. Its completed rows, planned load and effort remain in the draft's existing maps. Only remaining rows are initialized for the replacement; plan counts across both portions keep the same total. Archived slots are excluded from scheduling but included by `finishWorkout()` in history/progression under their original IDs. Existing unit conversion already covers all rows/planned loads. Fully completed exercises can update the future plan while retaining the original workout. This is an additive JSON field with no schema/key or database migration.

## Build versions and feedback provenance

`APP_RELEASES` in the inline app is the single release-note source. Both Node packaging scripts use `scripts/app-version.mjs` to validate unique, descending semantic versions and required notes, then stamp `APP_BUILD` with the checked-out full Git commit and a commit/content build ID. A public `version.json` contains this identity, environment and release history. The content suffix distinguishes local changed builds; no clock or request-time latest-version lookup is involved. The same identity versions the service-worker shell cache. HTML embeds its history and identity, preserving offline/older-tab provenance. Unpackaged source explicitly reports `source` without a deployment commit.

Migration `20261113162156_feedback_app_versions.sql` added nullable report-version/build/environment and resolution fields to the historical feedback table. It remains compatible historical schema. The direct GitHub form and retired admin inbox no longer depend on those columns; this delivery change requires no new Supabase migration. Existing rows, grants and policies remain intact for old clients. Do not apply an unrelated pending migration to production merely to enable GitHub feedback.

### Private delivery and admin inbox retirement

The current dev form sends a stable report UUID and allowlisted technical diagnostics to the same-origin `/api/feedback` Worker. Supabase Auth verifies the session against the Worker-selected project; the existing `account_status()` RPC enforces approval. The Worker fixes the destination to the private tracker, verifies repository privacy and creates issues through a server-only restricted credential. The form includes only the saved display name and verified account ID after disclosing attribution; no email, other profile fields or workout payload is attached. The owner approved production attribution and the cleaner report format after dev testing. Client-supplied fields and issue text never grant authority.

`FeedbackOutbox` is a per-account SQLite Durable Object using an environment/account hash. It persists before attempting delivery, bounds per-account intake, schedules durable retries and returns a delivered or pending receipt. Delivered text is purged; a digest/minimal receipt preserves deduplication across eviction/retries. A lost create response is reconciled by exact source marker without blindly sending again. Ambiguity that cannot be reconciled requires operator review. See [the delivery runbook, credential handling, checks and limits](FEEDBACK-DELIVERY-2026-11-13.md).

The old app-feedback list, unread polling and mark-read/done/resolution controls are removed. `inboxCards()` and `renderInbox()` retain only assigned-coach messaging. The `FB.owner` flag still supports account-management UI and is not a new permission boundary. Original database records are retained; cached older clients can still submit there. During transition, agents reconcile both source databases read-only into the private tracker. The duplicate inbox is also retired on production; publication evidence and verification limits live in the private tracker. The former `test-feedback-versions.sql` remains historical schema-test evidence; new delivery behavior is tested in the Workers runtime and app UI suites.

### Named build variants

`appVersionLabel()` formats the member-facing version: main is `v0.2.0`, standard development is `v0.2.0-dev`, and a named configuration can be `v0.2.0-dev-noir`. Settings uses only a tiny footer button; feedback uses a plain tiny label. Full diagnostic details stay in private tracker reports; release notes retain the loaded build identity.

Both packaging scripts accept `STRONG_START_VARIANT` as an optional lowercase slug (letters/digits, single hyphens, maximum 32 characters). Defaults are `main` for production packaging and `dev` for isolated development packaging. The variant is embedded in `APP_BUILD` and public version metadata; non-main build IDs begin with `variant--`, preserving it in the tracker's reported build without a database schema change. Historical database reports retain their original `app_build` values. Main is reserved for production packaging. Names describe configurations independently of branch names; adding a variant does not create hosting, change environment routing, or apply any visual/configuration changes. New test deployments must use the isolated dev build and retain dev database isolation.

The scoped feedback delivery/admin-inbox release was approved and published as `92bd527` on November 13, 2026. Production retains its previous exercise assets and UI; unrelated development version UI, animations and references stay on dev. The private tracker records live verification. Legacy Pages feedback uses the canonical authenticated API; dev retains its own backend, token and namespace. No Supabase migration or account/data mutation was applied.
