# Development Workers migration - November 11, 2026

Owner requested moving development hosting to `https://dev.strongstart.app/`, matching production Workers Static Assets and verifying the new site before retiring the old Pages test site. This authorizes development hosting and development Auth configuration only; main and production deployment/database/Auth settings remain unchanged.

## Configuration

- Separate Worker `strong-start-dev`; Workers Builds watches GitHub `dev` only, previews disabled. Production `strong-start` still watches `main` only.
- Build root `hosting/cloudflare-dev`, Node `22.23.0`, build `npm ci && npm run build`, deploy `npx cf deploy --prebuilt`. Dependencies match production's pinned cf `1.0.0-beta.30` and static adapter `4.160.1`.
- Both configurations import `hosting/shared-worker.ts`: compatibility date, direct HTML handling, workers.dev/preview URLs disabled, logs/traces enabled. Both packages import `scripts/hosting-assets.mjs`: no-cache/nosniff and internal root-to-index rewrite. The production extraction preserves the existing deployed configuration and generated public files; no main push is part of this migration.
- Development output remains `dist/`, always forces test mode, contains only development backend credentials, and uses prefixed browser storage plus the Testing banner/development manifest. Development additionally sets noindex and robots.txt disallow. Only public runtime files are packaged; repository docs and database files must return 404.
- Supabase development project is `gvyfgqhgqnfmtoytqpeo`; exact allowed new return URLs are root and index.html. Its Google callback remains `https://gvyfgqhgqnfmtoytqpeo.supabase.co/auth/v1/callback`. The old Pages return is retained during transition. No database migration or account provisioning.
- Existing restricted account-scoped build token reused; no new token or permission expansion. Never commit its value.

## Checks before retirement

Local checks pass: 49 persistence/workout scenarios, six offline scenarios, 15 simulated-domain cases, actual Workers routing/headers/public-asset comparisons and offline/reconnect, plus existing synthetic sync/conflict/recovery and setup/Settings/reload suites at 1280/390/320 px. Both dev and production configurations build; their generated Worker settings match except the Worker name.

Hosted candidate `4e7cc96cd98a4d494685e87ebd14fd2012d313dc` deployed successfully from GitHub through build `aa0c9508-b442-4ca3-9876-483156f2f1fc`, version `66af4b59-acd1-4652-aca4-c8c029105dfe`. Verified managed TLS and public DNS, all 13 development public assets, direct index/root routing, no-cache/nosniff/noindex, docs returning 404, test-only network destinations, manifest/banner/storage isolation, Google handoff with the unchanged development callback and new return URL, offline reopening/reconnect, and synthetic sync/setup scenarios at 1280/390/320 px. No captured page errors. This computer initially retained a negative DNS cache; browser checks used the independently verified public address with full TLS validation, and asset checks used curl --resolve. This is separate from public DNS provisioning. Credential submission, real account writes/reset email delivery and physical-device installation are separate verification limits; do not imply simulated RPC checks prove those operations.

## Old address and user state

After those hosted checks passed, the old Pages project was retired as an automatic deployment target: deployments_enabled and production_deployments_enabled are false, and preview_deployment_setting is none. Its last successful commit `4e7cc96` remains online as a recovery fallback; the project and stored browser data were not deleted. A subsequent dev documentation push verifies that only the new Worker rebuilds. The old test address is `https://strong-start-dev.pages.dev/`. Browser sessions, local drafts and installations are isolated by origin. Successfully synced test data stays in the same development database; unsynced local-only drafts do not automatically move. Keep old-origin recovery available while retiring its role as an active deployment target. Do not delete users, workouts or the database.

## Reproduce

```text
cd hosting/cloudflare-dev
npm ci
npm run build
npm run dev
```

Use supported Node `22.23.0` or another version allowed by package.json. From repository root:

```text
node scripts/test-domain-transition.cjs
node scripts/test-workers-hosting.cjs http://127.0.0.1:8787/
node scripts/test-workers-hosting.cjs https://dev.strongstart.app/
node scripts/test-sync-browser.cjs https://dev.strongstart.app/
node scripts/test-setup-settings.cjs https://dev.strongstart.app/
```

## Production boundary

Production remains release `c135c7e`, version `5ea58735-7b9d-4991-a45a-bcc9163b5d35`. No main merge, production deployment, production Auth setting, schema change or user/workout mutation was made. Development Auth Site URL was saved and reloaded as `https://dev.strongstart.app/`, with exact root/index allow-list entries and the old Pages root retained.
