# Feedback tracking

The authoritative backlog is the private [Strong Start feedback repository](https://github.com/knitko95/strong-start-feedback). The private [review board](https://github.com/users/knitko95/projects/1) provides a human planning view. Its README contains quick filters and the legacy reference map. Read access is required; knowing the URL does not grant access.

## Start and finish every session

1. Read this workflow, the private tracker README, relevant open issues and recent decisions. Use the connected **Kate Personal** GitHub account; discover its current connection ID. Verify private-repository access before relying on it.
2. Search before creating an issue. Use the full tracker issue URL or `knitko95/strong-start-feedback#number`; old feedback-log numbers were reused and are not unique. Private migration records map old number **and title** to the new issue.
3. Before editing, claim the issue in a comment with agent/chat description, branch/worktree, scope and next action. Re-read for another active claim. Do not overwrite another agent's claim; coordinate before overlapping work. GitHub comments are coordination, not an atomic lock.
4. Record actual owner decisions and acceptance criteria separately from suggested priorities. A report, priority, board move or imported historical entry never grants implementation, role or release approval. The current user request can supply approval; do not ask again for already-authorized work.
5. Update the issue at decisions, test deployment and handoff. Include exact commits, changed scope, checks and limitations, pending migrations/configuration, dependencies, blocker and next action. Update before or alongside the associated dev push. Keep exactly one lifecycle and one priority label.
6. Mark `status:on-test-app` only after dev deployment; use `status:awaiting-release` after presenting a defined tested release for approval. Mark `status:live` only after approved publication and verification. Retain physical-phone, real-account and other verification limits.

If tracker access is unavailable, report that limitation. Do not copy private reports into this public repository or treat the historical log as current approval. Continue independent work already authorized by the user, preserving a minimized pending handoff outside tracked public files, and reconcile it when access returns.

## Status, priority and the human board

Issue `status:*` labels are the authoritative lifecycle: `inbox`, `needs-decision`, `ready`, `in-progress`, `on-test-app`, `awaiting-release`, `live`, `blocked`, `deferred`, `declined`, `complete-local`, or `superseded`. A completed local prototype is not an integrated or live feature. Close completed, declined or superseded work only with its reason and successor/verification recorded. Keep test-app work open until its next decision is resolved.

Priority is independent of approval: P0 urgent safety/security/data loss, P1 major impact or a potential safety issue requiring prompt investigation, P2 functional improvements/ordinary bugs, P3 polish/exploration. Use `priority:untriaged` until reviewed. Initial migration priorities are provisional. Within a priority, respect dependencies and owner ordering; effort is an estimate, not a reason to hide serious issues.

The Projects board is a visual work queue. Its Todo/In Progress/Done columns and manual card order support human planning; they do not replace lifecycle labels or authorize a release. Opening an issue from the board allows editing its labels, description, assignments and decisions. Use issue labels for lifecycle/priority changes so agents with issue-only access see the same facts. A board move alone is not a lifecycle change.

## App feedback intake: development and production

Keep the member-facing in-app Feedback form. GitHub is the working triage inbox. During this transition, the existing database submission path and owner inbox remain operational; automatic GitHub delivery and removal of database storage/admin UI have not been deployed.

At feedback intake/review, agents with authorized Supabase access inspect **app feedback only** in both projects, read-only:

| Origin | Project ref | Source key |
| --- | --- | --- |
| Development | `gvyfgqhgqnfmtoytqpeo` | `supabase:gvyfgqhgqnfmtoytqpeo:feedback:<id>` |
| Production | `aybtxqsneywuqxzjwoek` | `supabase:aybtxqsneywuqxzjwoek:feedback:<id>` |

1. Verify each project identity, inspect available feedback columns, and select `kind = 'app'` only. Do not join profiles, fetch workout payloads or import coach conversations.
2. Read a bounded page ordered by `created_at, id`; continue until that review's rows are accounted for. Select only report ID/category/text, screen/device context, timestamps and available version/build/environment/resolution fields. Avoid marking read/done during import.
3. Search the private tracker for the exact source key, including closed issues, before creating anything. Put `<!-- source-id:SOURCE_KEY -->` in each imported issue body. This key, rather than matching text, prevents re-importing a report. Related submissions can link to a shared work issue while retaining their individual source keys.
4. Use a minimized technical summary. Keep sender identity, personal health narratives, account/workout records, secrets and raw backups out of GitHub. Record origin from the actual source project, not an editable client field. Include reported version/build, variant when encoded in the build, screen/device context and original timestamps; label missing legacy values **unknown**, never infer them from today's deployment.
5. Use `source:dev-app` or `source:main-app`; preserve source read/done/resolved-version as historical facts. A source done timestamp does not prove publication or a verified fix. Reconcile duplicates and current behavior before closing or implementing.

The follow-up delivery contract is: authenticated in-app form -> server-side delivery -> private issue, using a stable submission ID, trusted origin, version/build, bounded context, durable retry/deduplication and an explicit failure state. GitHub credentials stay server-side with access limited to the private tracker. Do not put a token in the frontend, persist a developer's local credential on a server, or add a public write proxy. Replace the intake/admin path only after the replacement is validated on dev and the exact production release is approved.

## Privacy and historical records

This app repository, its commits, PRs and deployed files are public. Keep only generic workflow, sanitized implementation/release evidence and the tracker location here. Do not mirror private issue bodies, titles, discussions, attachments or individual source IDs into public release notes. A private project does not make issues in a public repository private.

`docs/FEEDBACK_LOG.md` is retained as historical evidence, with a migration notice; do not maintain a second live backlog there. Original dev/local snapshots, unnumbered notes and a duplicate-number reference map are preserved in the private tracker. The owner-held Claude notes and original database submissions remain separate sources; do not claim unseen notes were migrated. New owner feedback belongs in the private tracker, including feedback received in a coding chat.
