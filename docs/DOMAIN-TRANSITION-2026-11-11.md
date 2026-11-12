# strongstart.app publication record — November 11, 2026

Prepared for development testing and owner review. **Owner approved the tested transition and production Auth changes November 11.** The initial source release was merged through PR #2 as `5304707e996aafb21a0587e4d4b148899de523a9`; the separately approved offline correction was merged through PR #3 as `c135c7e17354c6fb55285de28c963a1903839f45` and verified live. No database migration is part of this transition.

## Production publication and hosting verification

Cloudflare Workers Builds is connected directly to `knitko95/strong-start`, watching only `main`, with previews disabled. Build root is `hosting/cloudflare`, build command `npm ci && npm run build`, deploy command `npx cf deploy --prebuilt`, and Node `22.23.0`. The owner separately approved creating the restricted build token: Workers Scripts edit and Account Settings read for this account only. Its value is not committed. The initial Git build `4288be47-0943-4689-8a9d-cd2ee90f1ec6` succeeded and deployed version `908c031e-39a6-4b73-a6b3-6bd4eb6e6ed3` at 100%.

The Worker custom domain is `strongstart.app`, with managed DNS/TLS and public Worker/preview URLs disabled. Production Auth Site URL is `https://strongstart.app/`; exact root/index return URLs for the new and old GitHub addresses are saved. The default reset template uses `{{ .ConfirmationURL }}`. Custom SMTP is not configured; no password-reset email or credential submission is part of these checks. The Google backend callback remains unchanged.

Cloudflare's default browser analytics injection was disabled for this zone and the public HTML cache refreshed. Real browser responses then matched the approved source exactly. Real signed-out startup and synthetic sync/setup suites passed at desktop, 390 px and 320 px, with no captured errors. These synthetic account/RPC checks do not establish authenticated production writes.

The live offline check identified a hosting incompatibility: default HTML canonicalization redirects `/index.html` to `/`, so precaching records a redirected response that Chrome rejects for an offline navigation. The hosting-only correction sets `assets.htmlHandling` to `none` and internally rewrites `/` to `/index.html` with status 200. Existing root, index, privacy, invite and Auth URLs stay usable; no runtime HTML, service-worker logic, plans or database data change. Local Workers routing checks and a real Chrome offline/reconnect test pass, including a non-redirected cached index. An online refresh replaces any earlier redirected shell cache. Owner explicitly approved PR #3; automatic Git push build `46f7df50-5ce6-4dd6-bf97-6c1309bb3618` succeeded for `c135c7e`, deploying version `5ea58735-7b9d-4991-a45a-bcc9163b5d35` at 100%. A real live Chrome check at 390 px confirmed non-redirected cached index, offline reopening and reconnecting with no page errors. Normal DNS and valid HTTPS work; all 11 public runtime assets matched the approved package.

## Changes

The app recognizes exactly `https://strongstart.app/` and `/index.html` as production alongside the existing GitHub Pages app paths. Other origins/paths remain development. The dev build forces test mode even at the new production address and contains no production backend URL/key. Storage keys and v6 state are unchanged.

`scripts/build-production.mjs` packages only public runtime files into `dist-production/`, never documents, migrations, tools, credentials or accounts. Mutable files have revalidation headers. **Never publish `dist/` as production:** it is intentionally test-only.

`hosting/cloudflare/` prepares Workers Static Assets with pinned tools/lockfile, logs/traces enabled and Worker/preview public URLs disabled. It installs no domain, route, Git release trigger or backend binding. Existing Pages dev hosting is retained.

## Checks

- Fresh Cloudflare inspection confirmed the domain active, no DNS records or Workers/custom domains, and the existing Pages project building only dev with `node scripts/build-dev.mjs` into `dist`.
- Started from fetched, clean dev. A separate approved release advanced main during this task; merge `d9b8ff309205e4fbfccf23e1029f05c7dca3e47b` had exactly the same files as the dev baseline. Dev was fast-forwarded to it before committing this candidate. Unrelated exercise-animation output is excluded.
- Environment/syntax checks, 49 persistence/workout scenarios and six offline scenarios pass. Offline checks include the new root origin, scope isolation and Auth query/hash navigation.
- Twelve browser scenarios at 1280/390/320 px cover simulated new/old production addresses and isolated dev output: database/banner/manifest, invite storage/links, Google/reset return destinations, no horizontal overflow and paused-workout reload. Backend/SDK calls are intercepted; no production login, email or mutation occurs.
- Pinned Cloudflare CLI `1.0.0-beta.30` and static adapter `4.160.1` built successfully with supported Node `22.23.0`. Its local runtime serves HTML, privacy, manifest, service-worker/JS and icons, applies revalidation headers and returns 404 for repository documentation.
- Existing sync and setup/Settings browser suites pass at all three widths. The sync test server now serves JavaScript with its correct MIME type, fixing a harness-only service-worker error.

The delivery message identifies the exact hosted dev commit and verification. `scripts/test-hosted-environment.cjs` checks matching HTML, real signed-out startup/Google entry, isolation and all three widths without signing in or sending email.

## Cutover procedure and retained safeguards

1. Recheck branch heads and approve the exact domain-release delta from main. Do not include unrelated later dev work. This change introduces **no database migration**. During this task, read-only production inspection showed the previously prepared six feature migrations had been applied separately under production version IDs; do not replay them by filename. Recheck before release.
2. Inspect production Auth URL configuration. Set Site URL to `https://strongstart.app/`; allow exact return URLs `https://strongstart.app/` and `https://strongstart.app/index.html`. Preserve old GitHub Pages redirects during transition. Keep development URLs in the separate test project. Verify email templates honor the requested redirect. The connected Supabase tools do not expose Auth configuration; the production settings were saved and reloaded in the dashboard during the approved cutover.
3. Keep the production Google callback at `https://aybtxqsneywuqxzjwoek.supabase.co/auth/v1/callback` because the backend is unchanged. Review Google consent/homepage/authorized-origin settings for the new address. Do not rotate credentials or reuse the test OAuth client.
4. Publish only the approved source to main. In `hosting/cloudflare`, use supported Node, `npm ci`, then `npm run build`. Inspect `.cloudflare/output/v0/` and deploy that exact output with `npx cf deploy --prebuilt`. This is a production upload/deployment requiring approval even before domain attachment.
5. Attach `strongstart.app` using Worker Custom Domains; verify managed DNS/TLS. Test real new-domain sign-in/reset, sync, invites, installation and offline reopening with a deliberate session. Leave the test Pages project intact. Optionally configure `www` as a query-preserving redirect to the apex; no `www` route is installed by this candidate.
6. Keep the old GitHub app usable until users sync/export local-only work and verify their new-domain account. No automatic old-site redirect is included. A redirect-only retirement needs a separately approved, tested change handling old drafts, invites, Auth query/hash and installed Home Screen apps.
7. Future Workers Builds can connect to **main only**, previews disabled, build root `hosting/cloudflare`, build `npm ci && npm run build`, deploy `npx cf deploy --prebuilt`. Configure only as part of approved cutover; the main-only connection is now enabled for approved future releases. Main pushes still require explicit release approval.

## User transition and limits

Existing users sign in with the same account to retrieve successfully synced plans/history. Browsers isolate localStorage, sessions, service workers and installations by origin; unsynced old-origin drafts do not transfer automatically. Finish/sync or deliberately export a personal backup before moving. Avoid simultaneous old/new account editing. Install the new address separately after verifying account data; retain the old app until recovery is no longer needed.

Simulated-origin tests establish client routing and redirect arguments, not production provider configuration or OAuth/reset delivery. Managed DNS/TLS and the real Google sign-in handoff to the unchanged production callback were verified. Credential submission, authenticated production writes, reset email delivery, old-origin data recovery and physical-phone installation/background behavior remain unverified. No real account or workout data was changed by these checks. A hosting rollback does not undo previously released database migrations.

## Reproduce

```text
node scripts/build-dev.mjs
node scripts/build-production.mjs
node scripts/test-domain-transition.cjs
node scripts/test-sync-browser.cjs
node scripts/test-setup-settings.cjs
```

For Cloudflare tooling use Node `^22.23.0`, `^24.22.0` or `^26.12.0`:

```text
cd hosting/cloudflare
npm ci
npm run build
npm run dev
```

While the local runtime runs, from repository root:

```text
node scripts/test-domain-transition.cjs http://127.0.0.1:8787
```

These build/dev commands do not publish. Future production changes and retirement of GitHub Pages still require their own tested release approval.
