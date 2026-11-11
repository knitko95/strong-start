# Strong Start

A phone-first workout planner and tracker with 320 exercises, personalized six-week programs, guided warm-ups and cool-downs, progressive weight/rep targets, and coach support.

## Use the app

Open [Strong Start](https://knitko95.github.io/strong-start/). New accounts need a coach's one-use invite during beta. Sign in with Google or email/password, complete setup, then choose a workout from Today. The app can be added to a phone's Home Screen.

See [the app guide](docs/APP_GUIDE.md) for setup, workouts, settings, backups, and coach tools.

## Hosting and data

- The frontend is a static site in `index.html`, plus the privacy page, manifests, and icons. Production serves the source directly; development has a small Node build with isolation checks and no npm dependencies.
- [GitHub Pages](https://knitko95.github.io/strong-start/) publishes from `main`. Every push there is a production release and requires the user's explicit approval of the tested release.
- [The testing app](https://strong-start-dev.pages.dev/) automatically deploys from `dev` through Cloudflare Pages. Make and test changes there first.
- Supabase `strong-start` (`aybtxqsneywuqxzjwoek`) is production; `strong-start-dev` (`gvyfgqhgqnfmtoytqpeo`) is the isolated test backend. They handle authentication, account state, workout logs, coach updates, feedback, and invites separately.
- The production browser stores `{state, logs}` under `strongstart_state_v3`; development uses `dev_strongstart_state_v3`. Accounts and saved data are separate. Local-only support remains, but the guest entry button is hidden during beta.
- Settings > Backup copies/restores personal data. A restore can sync its replacement state and log deletions to the signed-in account; it is not just a local preview.
- There is no service worker. Local data/reconnect logic helps when an already-loaded app loses connectivity; reopening from scratch offline is not guaranteed.

## Work on the project

Agents should start with [AGENTS.md](AGENTS.md). Claude also loads [CLAUDE.md](CLAUDE.md), which imports the shared instructions.

Start from current `dev` (or a task branch based on it). Build and run a local test preview:

```powershell
node scripts/build-dev.mjs
python -m http.server 8731 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8731/`. The build uses only the test database and displays a Testing banner. Use synthetic data; use the hosted test site for its configured Google sign-in flow.

Push completed changes to `dev`, verify the hosted result, and present the tested changes and any database migrations for approval. **Only release to `main` or apply production database/configuration changes after the user explicitly approves that release.** Implementation requests and approval of previous releases do not authorize a new live release. See [environments and releases](docs/ENVIRONMENTS.md).

Read [architecture and operations](docs/ARCHITECTURE.md) for code locations, data contracts, validation, publishing, and rollback. [The dated review](docs/REVIEW-2026-11-11.md) records the analysis and limitations.

To undo published code, prepare and test the revert on `dev`, obtain approval for the rollback, then publish it. Database migrations need their own recovery plan and approval.
