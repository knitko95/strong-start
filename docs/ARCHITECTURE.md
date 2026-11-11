# Strong Start architecture and operations

Baseline review: November 11, 2026, production frontend commit `149f807bd8e67c7c95204157e07e33e1202763a7`. Environment operations below were updated after development setup at `2e4f071b7c4361cb387e5f14bfcbdd7ff76cd6b1`. Production database metadata came from `aybtxqsneywuqxzjwoek`; no production mutations were needed. Follow [AGENTS.md](../AGENTS.md) for the required dev-first workflow and explicit release approval.

## Runtime and deployment

The browser runs one HTML page with inline CSS/JavaScript. Rendering builds HTML strings and assigns them to `#app`, `#tabs`, and modal/timer containers. Delegated document click/input/change listeners dispatch using `data-action`. There is no bundler, dependency installation, application server, or router package. Development has a small Node build and checked-in syntax/environment checks; these do not replace application-flow tests.

`index.html` loads Supabase JS v2 from jsDelivr's UMD path and fonts from Google Fonts. The SDK follows the v2 major rather than an exact patch. The manifest/mobile metadata provides standalone/Home Screen presentation; there is no service worker or asset-cache strategy. Exercise media registries (`EX_PHOTOS`, `EX_MEDIA`) are empty: instructions are text and inline SVG muscle maps, not a shipped video/photo collection.

The public repository includes `.nojekyll`; no local `.github/workflows` directory exists. GitHub reports a successful generated **pages build and deployment** workflow (`dynamic/pages/pages-build-deployment`) for the reviewed `main` SHA: [run 42969162454](https://github.com/knitko95/strong-start/actions/runs/42969162454). This verifies the deployment route; the exact Pages settings screen was not inspected. Local/remote `main` matched during review.

Production is [knitko95.github.io/strong-start](https://knitko95.github.io/strong-start/) from `main`, with Supabase `aybtxqsneywuqxzjwoek`. Development is [strong-start-dev.pages.dev](https://strong-start-dev.pages.dev/) from `dev`, with Supabase `gvyfgqhgqnfmtoytqpeo`. Cloudflare runs `node scripts/build-dev.mjs`, which produces `dist/` and runs `scripts/check-environments.mjs`; only `dev` automatically deploys. See [environment configuration and release procedure](ENVIRONMENTS.md).

All implementation and testing happens on dev first. Present the verified candidate, migration list, and limitations for the user's explicit release approval before pushing/merging to `main` or making production database/Auth/configuration changes. Approval of development work is not release approval. Supabase is separately managed; a Git push neither migrates nor rolls back the database. Rollbacks also require approval.

The current source uses production only at the exact live origin/path. Other origins/paths, including localhost, select development, with prefixed localStorage keys and a test manifest/banner. The Cloudflare build forces development mode and removes production backend credentials from its output. `SITE_URL` uses the current origin/path for Google OAuth, email redirects, and invites. The test Google provider has its own OAuth client and hosted redirect; localhost redirects need their own test-project allow-list entries.

## Source map

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

Older workout rendering/event code remains alongside the focus/guide flow. `render()` routes the workout tab to `renderFocus`, not `renderWorkout`. Trace the active dispatcher before editing similarly named functions.

## Plan engine

The 320 pipe-delimited rows describe name, equipment codes, movement slots, plane, muscles, tier, mode, unilateral flag, and cue. Modes include loaded (`L`), bodyweight with added load (`B`), reps (`R`), timed (`T`), and power (`P`). IDs are name-derived slugs persisted throughout the app.

Equipment requirements are groups of alternatives: every group needs an available item. Selection combines equipment, experience, comfort, pain-area name filters, goals, jumps setting, equipment style, prior choices, and randomness. These are heuristic filters, not a clinical assessment. Preserve health wording/product decisions unless an approved change requires editing them.

Thirteen splits support two to five workouts weekly. Base `push`, `pull`, `legsA`, `legsB`, and `jump` slots combine into derived days. `fitSlots()` trims sets, pairs compatible supersets, reduces rests, and may remove smaller exercises to fit a time estimate. `finalize()` enforces shared-station rules. Optional post-lift cardio is outside the selected session length.

Plans use six-week blocks. Progression lives per exercise ID in `state.ex`; targets use prior sets, rep ranges, experience, and easy/hard feedback. Equipment uses different load ladders/increments. Introductory weeks reduce sets, with an age-dependent extension for beginners. `finishWorkout()` counts checked positive-rep/seconds sets, updates progression, appends a log, clears the draft, and queues saving.

## Local state and sync

| Item | Meaning |
| --- | --- |
| `strongstart_state_v3` | Local JSON `{state, logs}`; current `state.v` is 5 |
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

`save()` timestamps state, persists locally, and schedules upload after 1.2 seconds. `CLOUD.busy/again` serializes uploads; `written` and `stateJson` avoid resending unchanged records. State upsert, workout upserts/deletes, and name updates are separate operations, not one transaction.

On sign-in, access is checked, a different account's cache is discarded, and state/logs/roles are fetched. Logs merge by ID, remote winning duplicate IDs. The whole remote state wins when substantive and at least as new as local (or local is not substantive). `pushCloud()` reconciles logs against known remote IDs, including deletes.

Foreground visibility and `online` events trigger `pullCloud()`. A newer state can reload when no draft is active. Pending coach updates wait for a block and no draft, apply in ID order, get marked applied, then save. A paused draft still blocks them. This is event-driven/polling reconciliation, not Realtime subscriptions or field-level conflict resolution.

`migrate()` upgrades older state; v4 requests renewed setup for older states while retaining some records, and v5 preserves legacy split preferences. New migrations should be compatible and tested. The lb/kg action does not convert saved numbers.

## Database structure

All eight public tables had RLS enabled. Auth identities live in managed `auth.users`. This is structural documentation, not an export of people's data.

| Table | Key/data | Purpose |
| --- | --- | --- |
| `profiles` | `id` -> Auth user; email/name, last_seen, approved_at, invited_by, disabled_at | Profile/approval/disable status |
| `app_state` | `user_id`; JSONB state; bigint updated_at, saved_at | Latest whole state |
| `workout_logs` | Composite `(user_id,id)`; date, JSONB data | Completed sessions |
| `plan_updates` | Identity id; user_id, created_by, JSONB update, created_at, applied_at | Coach update queue |
| `coaches` | `user_id` -> Auth user | Coach membership |
| `app_owners` | `user_id` -> Auth user | Owner membership |
| `feedback` | Identity id; nullable user_id -> profile, kind/tag/message/context, read_at/done_at | App/coach inboxes |
| `invites` | UUID id; unique code, creator/name/expiry/use/cancel fields | Single-use beta access |

Messages are constrained to 1-4000 trimmed characters; context fields also have limits. Invite names are at most 80 characters; default expiry is 14 days.

Auth-user deletion cascades through core account records. Feedback's profile reference becomes null; `admin_delete_account()` first removes coach messages and clears retained app-feedback workout context. Invite `used_by` and profile `invited_by` become null where configured.

### Authorization to preserve

- Members read/write their own state/workouts; coaches read across accounts. Members alone update their state. Workflow-table restrictive policies also require `is_approved()`.
- Profile reads allow self/coach/owner. Client inserts allow id/email/name/last_seen; updates allow email/name/last_seen. Approval/inviter/disable columns are excluded. RLS-only review misses this protection.
- Feedback reads allow self or the appropriate inbox role. Inserts are limited to message/context columns; `user_id` defaults to `auth.uid()`. Inbox updates are limited to `read_at`/`done_at`.
- Invites are created by the coach-only RPC. Coaches read their own and update only `cancelled_at` on eligible unused rows.
- Coaches insert plan updates as themselves. Recipients update their own rows to mark application. This table still has broad column update grants; see the review.
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
