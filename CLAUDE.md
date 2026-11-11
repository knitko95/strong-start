# Strong Start: rules for working on this app

This repository IS the live app. Every push to `main` goes live at https://knitko95.github.io/strong-start/ within a minute or two.

## Never
- Never use or update the old claude.ai artifact (https://claude.ai/artifact/YSGbuUHKJSAgWMpr3QiXa1). It is retired.
- Never replace `index.html` with a copy from another chat, an artifact, an attachment or an older commit. Older copies are missing accounts, Google sign-in, the coach view and the privacy link. Bring changes in by merging only the parts that changed.
- Never put secrets in this repo (it is public). The Supabase URL and publishable key in `index.html` are meant to be public; the Google client secret, Supabase service-role key and database password are not.
- Never add an exercise feature, wording change or design change the owner hasn't approved. Items are discussed one at a time in the project's feedback log (`claude/strong-start-feedback-log.md`) and built only after she says so.
- Never make anyone a coach (the `coaches` table) without the owner confirming in chat, and only for a Google sign-in (email confirmation is off, so email/password addresses are unverified).

## Always
- Start from the latest `main` (`git pull`). Work on a copy, test, then push.
- Test before pushing: syntax-check the main script, load the page in a headless browser with no console errors, and click through what changed. After pushing, open the live site and check it there.
- Keep everything in one `index.html` (plus `privacy.html`, `manifest.webmanifest`, `icons/`).
- Commit messages say in plain words what changed for the person using the app.
- After shipping, update the feedback log (status → Live) and, for bigger changes, `claude/strong-start-planned-updates.md`.

## How the app saves data
- Accounts: Supabase project `strong-start` (id `aybtxqsneywuqxzjwoek`). Tables: `profiles`, `app_state` (whole app state as JSON), `workout_logs` (one row per workout), `plan_updates` (coach → person), `coaches`. Row-level security: people see only their own data; coaches read everyone and send plan updates.
- Sign-in: email + password, or Google. "Use without an account" keeps data on the device only.
- The phone keeps a copy in localStorage (`strongstart_state_v3`) so the app works offline; it syncs on reopen or when back online.
- If you change the shape of the saved state, add the upgrade step in `migrate()` so existing people's data is carried forward, never wiped.
- Database changes: use migrations, then run the Supabase security advisor. Test rules with a rolled-back transaction, not on real people's data.
