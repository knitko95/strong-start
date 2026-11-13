# Development and production

## Production domain

The live app is [strongstart.app](https://strongstart.app/), deployed from GitHub `main` through Cloudflare Workers Builds. The owner approved the cutover and the separately tested offline routing correction (PR #3); release `c135c7e` is verified live. Existing GitHub Pages and isolated test Pages hosting remain available. See [publication results and limits](DOMAIN-TRANSITION-2026-11-11.md).

## Release policy

All changes are developed and tested on `dev` before release. A request to implement or fix something authorizes development and the Cloudflare test deployment, not publication to the live app. Only the user's explicit approval of the tested release authorizes a merge/push to `main`, a live deployment, or its production database/Auth/configuration changes. This includes documentation-only pushes to `main`, hotfixes, and rollbacks.

Before requesting approval, provide the hosted dev URL, tested commit/change set, relevant test results and limitations, pending migration files, and any production configuration/recovery steps. Approval covers that release only; do not include unrelated pending dev work. Material changes to the candidate require retesting and renewed approval. If that exact release was already explicitly approved in the current conversation, do not request the same approval again.

While waiting, leave the work on `dev` or in a draft/unmerged release PR. Never enable auto-merge or an automatic production release as a shortcut. These are agent workflow rules, not a claim that branch protections or technical approval gates have been installed. [AGENTS.md](../AGENTS.md) is the authoritative shared policy.

## Targets

| Environment | Source | Host | Supabase ref |
| --- | --- | --- | --- |
| Production | `main` | `https://strongstart.app/` | `aybtxqsneywuqxzjwoek` |
| Development | `dev` | `https://dev.strongstart.app/` | `gvyfgqhgqnfmtoytqpeo` |

Both sites use Workers Static Assets with shared routing/runtime settings in `hosting/shared-worker.ts` and shared cache/security rules in `scripts/hosting-assets.mjs`. Development adds noindex headers and robots.txt. The dev build forces test mode and removes production backend credentials even if served at the production hostname.

Workers Builds connects to the same GitHub repository with previews disabled. Development watches **dev only**, root `hosting/cloudflare-dev`; production watches **main only**, root `hosting/cloudflare`. Both use Node `22.23.0`, build `npm ci && npm run build`, and the same pinned cf/static-adapter versions. Production deploys with `npx cf deploy --prebuilt`. Development now deploys with `npm run deploy`, a dev-only wrapper that securely uploads the encrypted build secret as the feedback Worker's runtime secret. The dev build also runs its Workers-runtime tests. See [feedback delivery and credential operations](FEEDBACK-DELIVERY-2026-11-13.md). The existing restricted account-scoped Cloudflare build token is reused without expanding permissions or publishing its value. Production configuration is unchanged.

The development migration is complete. Normal DNS and HTTPS access were verified November 11 without an IP override; hosted asset/isolation/offline checks passed at all three viewport widths. The old Pages test site has automatic deployments disabled and retains commit `4e7cc96` as a recovery fallback. See [migration checks and retirement status](DEV-WORKERS-2026-11-11.md). GitHub Pages still serves the old production address from main.

The source page uses the production backend only at the exact strongstart.app root/index paths and retained GitHub Pages app paths. Other URLs, including localhost, use the test backend. The development build additionally removes production credentials and forces development mode. Development localStorage keys have a `dev_` prefix; Supabase sessions are scoped to their project. The testing banner and Home Screen manifest distinguish this installation.

No production accounts, workouts, messages, invites, or staff assignments are copied into development. Test accounts are separate. A separate Google OAuth client is configured for the test project, with callback `https://gvyfgqhgqnfmtoytqpeo.supabase.co/auth/v1/callback` and site/allowed redirect `https://dev.strongstart.app/`. Credentials stay in the provider dashboards. Database migrations do not copy Auth configuration. Preserve the invite-only beta and explicitly approve staff provisioning.

## Checks

```sh
node scripts/build-dev.mjs
node scripts/check-environments.mjs
python -m http.server 8731 --bind 127.0.0.1 --directory dist
```

Check the Testing banner, sign-in, account sync, and the affected flow at desktop and phone widths. Production requests must never occur from the development build.

## Database changes and releases

The seven historical SQL files were recovered from production migration history. Their original version IDs are retained and matched in the test database. One account-specific owner assignment in `feedback_inboxes` is intentionally omitted; staff provisioning is separate. Production migration history and data were not modified.

1. Fetch and compare `dev` and `main`; work from current `dev`, preserving other work. Bring relevant main changes into the candidate before testing. Add each new schema/data change as a versioned migration, using the Supabase CLI's `migration new` command. Never edit an already-applied migration.
2. Apply new migrations to **development** first. Verify policies, grants, functions, and client behavior; run security advisors. Keep synthetic seed/test data outside release migrations.
3. Push changes to `dev`; Cloudflare automatically deploys the test site. Wait for the exact SHA and verify the affected flow. For docs-only changes, validate links/diffs and deployment status instead of exercising account mutations.
4. Present the completed tested candidate for explicit release approval using the release policy above. After approval, recheck branch state and production migration history, and review exactly which migrations are pending. If the candidate materially changes during integration, retest on dev and obtain revised approval. Apply only approved compatible additive migrations to production, then merge the approved app change into `main`. Destructive changes need a separately approved compatibility/backup plan. Never release all pending dev work merely because one change was approved.
5. Verify Cloudflare Workers Builds for the release SHA and the live flow. Reverting frontend code does not reverse database changes.

There is deliberately no automatic production database migration or production release on a `dev` push. Do not restore the test database over production or promote test account records.

## Verification on November 11, 2026

- Schema parity: 10 table/sequence entries, 46 columns, 22 policies, 11 functions, 27 constraints, and 564 column-grant entries matched production.
- Synthetic tests in a rolled-back development transaction checked account isolation, denied cross-account writes, approval-column protection, owner-RPC denial, and disabled-account access.
- All seven migration version IDs match production history. No production migrations or member records were changed.
- The hosted development HTML contains only the test database reference. `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` are present.
- Hosted sign-in page loaded with no captured browser errors/warnings. Environment checks preserve production storage keys and isolate development state/account keys.
- Google sign-in, the approved test coach/owner dashboard, and saved test state across reloads were verified. The later `dev` update at `2e4f071b7c4361cb387e5f14bfcbdd7ff76cd6b1` automatically built, passed isolation checks, and deployed successfully.
- Production HTML SHA-256 matched the unchanged `main` commit `149f807bd8e67c7c95204157e07e33e1202763a7`.
- Security advisor notices match the deliberately restricted role tables and the existing authenticated security-definer RPC design. Functional permission checks passed; this is not a full security audit.
- The browser viewport override did not apply, so a phone-width visual check remains unverified.

## Pending atomic-sync release

Development has migration `20261111184231_atomic_account_sync.sql` and the matching frontend; production does not. See [sync verification and release limits](SYNC-REVIEW-2026-11-11.md). This migration deliberately denies legacy direct writes. An approved release must apply the migration and publish the matching frontend in a coordinated window, then ask existing open tabs/Home Screen sessions to reload. Cached old clients preserve their local copy but cannot sync until refreshed. A frontend-only rollback to the old save protocol is incompatible; prepare and test any rollback separately. Do not restore old broad write grants as an automatic workaround.

## Independent experience experiments

`dev1` and `dev2` are independent branches and Workers at https://dev1.strongstart.app/ and https://dev2.strongstart.app/. Each starts from dev; later dev updates are merged deliberately, never automatically. Their build roots are `hosting/cloudflare-dev1` and `hosting/cloudflare-dev2`. The existing dev/main build triggers are unchanged.

Run `node scripts/build-preview.mjs dev1` (or dev2) to build locally. Both force the development backend, stamp the variant in version metadata/feedback, identify the installed app, and reject a mismatched CI branch. Each origin has its own browser storage, sessions and offline cache. Feedback uses a same-origin proxy to the existing dev feedback service, retaining its verified Auth and outbox. No feedback credentials are duplicated.

All three test apps share Supabase `gvyfgqhgqnfmtoytqpeo`: the same test account edits the same saved plan, workout history and messages. Avoid simultaneous edits; existing sync-conflict handling still applies. These branches support visual changes and entirely different UX/prompts. Preserve the shared persistence contract; coordinate compatible migrations through dev and do not reset or reinterpret another variant's saved data. Use separate test accounts when experiment data should differ. Production remains separate.

Experiment changes can stay on their named branch without changing dev. Promotion to the regular app requires deliberate integration into dev, hosted testing and explicit approval before production.
