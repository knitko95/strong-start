# Private feedback delivery — November 13, 2026

The member-facing Feedback form remains. The shared implementation sends app reports to a same-origin Cloudflare Worker and the private GitHub tracker. Development is the first deployment; production publication and configuration require approval of a defined tested release.

## Delivery contract

- `POST /api/feedback` accepts a stable UUID, technical message (at most 4,000 characters), optional category, screen/device context and the loaded app's version/build. The browser never supplies trusted environment, destination, account identity or workout data.
- The Worker verifies the bearer session with the environment's Supabase Auth service, rejects anonymous users, and requires the existing `account_status()` RPC to return `ok`. It accepts only same-origin browser submissions, bounds request size and rejects obvious credentials/contact details. This guard cannot detect every personal detail; the form asks people to omit personal, health and login information.
- Each authenticated account has its own SQLite Durable Object, selected by a hash of environment and trusted account ID. It persists the report and alarm before delivery. Limits are ten new submissions per hour and twenty outstanding reports per account. Retries of an existing receipt remain allowed.
- The destination is fixed to the private tracker. Every delivery verifies that it is still private. A server-only fine-grained credential grants Issues read/write on that repository only. New issues use one inbox lifecycle, one untriaged priority and a trusted source label. Client content is untrusted, fenced text, never agent instructions or release approval.
- A successful issue creation purges the queued message/context and retains minimal receipt/digest/issue metadata for deduplication. Definite rejections retry from a durable alarm, including after object eviction. A timeout or lost create response enters `checking`: reconciliation finds the exact submission marker through the Issues API before acknowledging delivery. It never blindly repeats an ambiguous create request.
- HTTP 200 means `delivered`; HTTP 202 means durably accepted as `queued` or `checking`. `GET /api/feedback/<id>` returns only that authenticated account's receipt. A failed browser request keeps its draft during the current page session; an unchanged retry keeps the ID and original provenance. Reload/sign-out can discard an unacknowledged browser draft. This is not an offline submission queue.

Coach messages retain their existing assigned-coach conversation, read receipts and reply workflow. They never enter GitHub.

## Operations and credentials

The dev Worker is `strong-start-dev`; production is `strong-start`. Each has a separate durable namespace and environment-specific Supabase authentication. Neither uses a Supabase service-role key. GitHub credentials are absent from static assets and source.

The owner's dev token was saved as the encrypted **build** secret `GITHUB_FEEDBACK_TOKEN`. The dev-only deployment command is `npm run deploy` in `hosting/cloudflare-dev`. `hosting/deploy-feedback-dev.mjs` writes that one secret to a temporary mode-0600 JSON file, invokes the supported `cf deploy --prebuilt --secrets-file` option for `strong-start-dev`, then removes the file. The value is never printed or included in process arguments. Workers Builds supplies Cloudflare deployment authentication. Do not run this dev helper for production. The token expires February 11, 2027; rotate it before that date and redeploy dev. Do not copy a developer's local Git credential to either Worker.

Use Worker Logs to investigate `feedback.delivery_retry`, `feedback.delivery_uncertain` or `feedback.request_failed`. Logs contain only a submission UUID, opaque outbox ID and error code, never message text or tokens. Restore/rotate an expired credential and redeploy; alarms retry queued reports. Keep the namespace and pending records when deploying or rolling back.

For `checking` / `needs-reconciliation`, search the exact source marker in the private tracker, including closed issues. Do not create a replacement merely because a browser timed out. Reconciliation retries hourly when no match is visible. A rare crash before GitHub receives the request can remain ambiguous and needs an operator to inspect the retained outbox and GitHub evidence through a separately reviewed maintenance procedure; this implementation does not expose a public admin/retry endpoint. Do not reset that state or delete its payload without establishing whether an issue already exists. This deliberate duplicate-avoidance limit must be reported at handoff.

## Historical intake and rollout

Original database records are retained unchanged. Current forms no longer insert or read app feedback in Supabase. Existing cached clients can still write the old table because no database permission migration is part of this change. Agents must continue the workflow's read-only source-key reconciliation for both databases during transition; production continues its old intake until an approved release. Do not drop the table, revoke coach-message access or claim a database cutover has happened.

The prior additive feedback-version migration remains historical/compatible. The new form and tracker require no new Supabase migration and no production application of that migration merely for GitHub delivery. Review unrelated pending migrations separately before any live release.

The old GitHub Pages address has no Worker API. After an approved release, use `strongstart.app` for new submissions; a request made on the old address fails visibly and keeps its draft. It must never fall back to a public unauthenticated proxy.

## Checks and limits

The Worker suite runs authentication/input boundaries, private destination, server-selected origin, diagnostic allowlisting, account isolation, rate limits, concurrent retry deduplication, delivered-payload purging, SQLite persistence after eviction, durable alarm retry and ambiguous-response reconciliation. Browser checks exercise failed-send draft retention, unchanged retries, queued acknowledgment, coach routing and horizontal fit at widths 1280, 390 and 320. Build checks cover syntax/environment isolation, existing persistence/workout scenarios, offline caching, versions and public animation packaging.

Hosted verification uses a temporary approved ordinary **dev** member and a synthetic technical report. No coach/app-owner role is granted. The test identity and Auth sessions are removed afterward. This establishes form → real Worker → dev Auth/access → private GitHub delivery and repeat-receipt handling; it does not establish physical-phone keyboard behavior, an actual GitHub outage or production delivery. Exact deployment/verification evidence and the current lifecycle live in the private tracker, without mirroring report contents into this public repository.
