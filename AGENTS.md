# Strong Start: agent instructions

Read this file first. It is the shared guidance for coding agents; `CLAUDE.md` imports it. Read [the app guide](docs/APP_GUIDE.md) for user/coach workflows, [architecture](docs/ARCHITECTURE.md) before changing persistence or permissions, and [the dated review](docs/REVIEW-2026-11-11.md) for findings and verification limits.

## Scope and owner decisions

- Work on the feature or fix the user requested. Do not introduce unsolicited exercise features, wording changes, or design changes without the owner's approval. The current request can provide that approval; do not ask again for work already authorized.
- Preserve unrelated local changes. Check `git status --short` and the current branch before editing.
- Patch the current source. Never replace `index.html` with an older commit, another chat's copy, an attachment, or the retired Claude artifact at `https://claude.ai/artifact/YSGbuUHKJSAgWMpr3QiXa1`.
- Read [the feedback workflow](docs/FEEDBACK_WORKFLOW.md), then the private [feedback tracker](https://github.com/knitko95/strong-start-feedback) README and relevant open issues at the start of each session. The private tracker is authoritative for feedback, decisions, priorities, claims and handoffs; [the old log](docs/FEEDBACK_LOG.md) is historical evidence, not a second live backlog. Discover the **Kate Personal** GitHub connection and verify private-repository access. Search before creating an issue; identify legacy items by number **and title**, because old numbers were reused. Claim the issue with agent/chat description, scope, branch and next action before editing; check for another active claim. Update its single `status:*` and `priority:*` labels and evidence before or alongside each dev push. Mark test deployment and verified live publication separately; never infer approval from priority, a board move or a report. Keep private report details, personal information and private discussions out of this public repository, PRs and release notes. Follow the workflow's access-failure and read-only intake rules for both app databases; do not import coach conversations. The owner's separate Claude notes are not automatically accessible or migrated; missing tracker entries do not block development explicitly authorized in the current request.
- Never grant coach or app-owner access without the owner's explicit confirmation. For coaches, preserve the existing Google-sign-in-only rule: email/password addresses were documented as unverified. Verify provider identity through trusted Auth information, not a typed email or editable user metadata.

## Required workflow: dev first, approval before live

- Make and test all changes on `dev` first. Short-lived task branches/worktrees must start from current `dev` and return to `dev` for hosted testing. Do not implement directly on `main`.
- Requests to build, fix, investigate, or update documentation authorize the requested development work and its test deployment. They do **not** authorize a production release. Successful tests, a merged task branch, or approval of an earlier release are not permission to publish new changes.
- Before requesting release approval, finish the authorized implementation, run the relevant checks, deploy the candidate to `dev`, and verify it at `https://dev.strongstart.app/`. Present the tested commit/change set, test results and limitations, and any pending database migrations or production configuration changes.
- Only after the user explicitly approves that release may you merge/push to `main`, publish to the live site, or apply its production database/Auth/configuration changes. This also applies to documentation-only pushes to `main`, hotfixes, and rollbacks. A production change outside the approved scope needs separate approval.
- Approval applies to the defined tested release, not every pending change on `dev` and not future releases. If the candidate changes materially, test it again and obtain approval for the revised scope. Do not ask again when the exact release has already been explicitly approved in the current conversation.
- While awaiting release approval, leave the tested work on `dev` and provide the preview link. A draft/unmerged PR is fine; do not enable auto-merge or automation that releases without the user's approval.
- These are agent operating rules. They do not establish a GitHub branch-protection or reviewer requirement; do not claim a technical release gate exists unless independently verified.

## Production and access

- Public repository: `https://github.com/knitko95/strong-start`; production: `https://strongstart.app/`. The previous GitHub Pages address remains usable during transition.
- Pushing to `main` publishes production through Cloudflare Workers Builds (and retains the old GitHub Pages site). A push is a release and requires the explicit release approval above. Pushing to `dev` automatically publishes the isolated Cloudflare test site; other branch previews are disabled.
- Before implementation, fetch and compare current `dev` and `main`. Work from current `dev`; in a clean checkout on `dev`, use `git pull --ff-only`. Preserve dirty changes and integrate any relevant `main` updates into the development candidate before testing. Do not force-push `main` or replace unreviewed development work.
- Keep the runtime app in `index.html`, `privacy.html`, manifests, `.nojekyll`, and `icons/`. The development build is `node scripts/build-dev.mjs`, outputs `dist/`, and runs `scripts/check-environments.mjs`. It needs Node but no npm dependencies or frontend framework. Cloudflare production builds from `hosting/cloudflare` using `npm ci && npm run build` then `npx cf deploy --prebuilt`; it packages public runtime files only. GitHub Pages still serves the source at the old address. See [environments and releases](docs/ENVIRONMENTS.md).
- Supabase production: `strong-start`, ref `aybtxqsneywuqxzjwoek`; development: `strong-start-dev`, ref `gvyfgqhgqnfmtoytqpeo`; both in `us-east-2`. Use development for migrations and mutation tests. Production read-only inspection is allowed for diagnosis; production mutations require explicit approval for that action/release. Use connected Supabase tools and verify the target ref before every mutation.
- The connected GitHub account for this repository is named **Kate Personal**. Discover the current connection rather than copying session-specific tool IDs. Write permission was verified on 2026-11-11; verify it again when needed. Local Git credentials are a separate access path.
- The frontend Supabase URL and publishable key are public by design. Never commit database passwords, personal access tokens, service-role/secret keys, Google client secrets, Auth sessions, real backups, invite codes, or people's account/workout/message data. Use synthetic fixtures.

## Code and data invariants

- `index.html` contains CSS, exercise catalog, state, rendering, events, and backend integration. Navigate by section comments/functions; line numbers drift.
- Production local key: `strongstart_state_v3`, value `{state, logs}` with optional account-scoped `sync` baseline/recovery metadata; development uses `dev_strongstart_state_v3` and prefixes the other app storage keys too. State schema is currently `v:6`; the key suffix is not the schema version. Preserve environment routing and isolation checks. Cloud state is a whole JSON document; completed logs are separate rows.
- Add compatible upgrades to `migrate()` when saved data changes. Keep users' plans, weights, history, and drafts. Do not bump the storage key to reset everyone.
- Exercise IDs come from names via `slugify()`. Renaming can orphan plan slots, progression, substitutions, and history; provide an explicit ID migration for an approved rename.
- Retain exercise auditing references in [the source register](docs/EXERCISE-SOURCES.md) and dated evidence records, outside the app. Preserve NASM associations when adding other credible publishers; record exact URLs, review dates, movement match, facts checked, source conflicts and unresolved gaps. A related reference is not individual exercise validation. Update the register with later exercise audits; do not copy third-party instructions/media into the app or add reference UI without a separate request.
- Preserve `save()` / `persistLocal()` / `queueCloud()`, account ownership isolation, and `coachMode` save guards. Coach preview must not write another person's state directly or overwrite the coach's cached state.
- Coach updates use `plan_updates` and wait while a workout draft exists. `planCode()` sends plan/original picks/adjustments/note/level, not every setting.
- Use `esc()` for user-controlled HTML content. Role, approval, and disable authorization belong in database policies/functions, not only in hidden buttons.
- Inspect both RLS and table/column grants before changing permissions. `coaches` and `app_owners` have RLS with no client policies; do not add broad policies to silence notices. Member self-edits exclude approval and disable columns.
- Schema changes require a versioned file in `supabase/migrations/`, development validation, and security-advisor review. Inspect current tables/functions/grants/policies first. Run role/mutation tests against development with synthetic fixtures; roll back transaction fixtures and avoid external side effects. Do not test against production rows. Promote reviewed migration scripts only after release approval, never a copy of the test database or its users/workouts.
- Preserve the invite-only beta. The guest entry button is hidden, although local-only code remains. A publishable key grants no database administration rights.

- Feedback uses authenticated Worker delivery and the private tracker. Preserve bounded diagnostics, stable IDs, durable retry, environment/account isolation and duplicate protection. New forms disclose sharing the server-saved display name and verified account ID in private GitHub issues. Do not attach email, other profile/workout data or credentials. Older forms and queued reports stay unattributed; do not backfill identities. Names are editable labels, not authorization. Attribution remains in GitHub after account deletion unless removed/redacted by the owner. The app admin inbox is retired; historical database feedback and stale-client reconciliation remain. See [feedback operations](docs/FEEDBACK-DELIVERY-2026-11-13.md).

## Local checks and publication

1. On `dev`, build the isolated site and run its automatic syntax/environment checks. Serve `dist/` locally with synthetic test data:

   ```powershell
   node scripts/build-dev.mjs
   python -m http.server 8731 --bind 127.0.0.1 --directory dist
   ```

2. Open `http://127.0.0.1:8731/`; verify the Testing banner and development backend. The current dev source also routes localhost to the test database. OAuth/reset redirects use the current origin/path: use the hosted dev URL for configured Google sign-in, or explicitly configure an intended local redirect on the test project. Never point a local test at production to make sign-in work.
3. For application changes, load the page in a headless browser with no unexpected console errors and click through the affected flow. Also check a narrow phone viewport. Report unavailable checks honestly. Documentation-only edits need link/diff checks, not new accounts or a new test framework.
4. Match checks to the change: setup and new/returning state; preview/start/logging/pause/reload/finish; history; swaps/adjustments; cloud failure/reconnect/account switching; or the affected coach/owner permission boundary. See `docs/ARCHITECTURE.md`.
5. Run `git diff --check`, inspect the diff, and use plain-language commit messages describing the result for the user. Stage only intended files, excluding test fixtures/credentials.
6. Push the intended changes to `dev`, wait for the Cloudflare deployment of that exact SHA, and verify the affected hosted flow. For documentation-only changes, check links/diffs and deployment status; do not create test accounts or change app/database behavior merely to verify prose.
7. Present the tested candidate and pending migrations/configuration changes for explicit release approval. Until approved, stop before any production mutation, merge to `main`, or live deployment. Do not bundle unrelated dev commits into the release.
8. After approval, recheck branch/database state. If integration changes the tested candidate materially, return it to dev testing and renewed approval. Otherwise apply the approved compatible migrations in the planned order, merge/push normally to `main`, wait for Cloudflare Workers Builds for the exact release SHA, and verify the live behavior. Deployment success alone does not prove the feature or policies work.
9. Report changes, checks, dev/production publication status, and unverified behavior separately. A rollback is another approved release, normally a new revert commit tested on dev; frontend rollback does not reverse a database migration.

## Keep this handoff current

Keep operational rules here and deeper explanations in `docs/`. Update the app guide/architecture when behavior changes. Date reviews and name their source/check scope. Recheck remote and database facts before consequential work; a review is a snapshot.
