# Development and production

## Targets

| Environment | Source | Host | Supabase ref |
| --- | --- | --- | --- |
| Production | `main` | `https://knitko95.github.io/strong-start/` | `aybtxqsneywuqxzjwoek` |
| Development | `dev` | Cloudflare Pages project `strong-start-dev` | `gvyfgqhgqnfmtoytqpeo` |

Cloudflare build command: `node scripts/build-dev.mjs`. Output directory: `dist`. Set the Cloudflare project's production branch to `dev`; this means its stable testing URL, not the live app. Disable preview branch deployments. GitHub Pages remains on `main`.

The source page uses the production backend only at the exact existing production origin/path. Other URLs, including localhost, use the test backend. The Cloudflare build additionally removes production credentials and forces development mode. Development localStorage keys have a `dev_` prefix; Supabase sessions are scoped to their project. The testing banner and Home Screen manifest distinguish this installation.

No real accounts, workouts, messages, invites, or staff assignments are copied into development. Test accounts are separate. Auth provider configuration and redirect URLs must be configured separately; database migrations do not copy Google OAuth settings. Preserve the invite-only beta and explicitly approve staff provisioning.

## Checks

```sh
node scripts/build-dev.mjs
node scripts/check-environments.mjs
python -m http.server 8731 --bind 127.0.0.1 --directory dist
```

Check the Testing banner, sign-in, account sync, and the affected flow at desktop and phone widths. Production requests must never occur from the development build.

## Database changes and releases

The seven historical SQL files were recovered from production migration history. Their original version IDs are retained and matched in the test database. One account-specific owner assignment in `feedback_inboxes` is intentionally omitted; staff provisioning is separate. Production migration history and data were not modified.

1. Add each new schema/data change as a versioned migration, using the Supabase CLI's `migration new` command. Never edit a migration already applied to both environments.
2. Apply new migrations to **development** first. Verify policies, grants, functions, and client behavior; run security advisors. Keep synthetic seed/test data outside release migrations.
3. Push app changes to `dev`; Cloudflare automatically deploys the test site.
4. After release approval, compare production migration history and review exactly which migrations are pending. Apply compatible additive migrations to production, then merge the reviewed app change into `main`. Destructive changes need a separate compatibility/backup plan.
5. Verify GitHub Pages for the release SHA and the live flow. Reverting frontend code does not reverse database changes.

There is deliberately no automatic production database migration or production release on a `dev` push. Do not restore the test database over production or promote test account records.
