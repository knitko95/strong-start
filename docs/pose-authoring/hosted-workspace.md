# Private hosted exercise workspace

The development review page at `https://dev.strongstart.app/exercise-guides/pose-review/` connects to shared private records. It requires an authorized Google sign-in. The server verifies the Google identity through development Supabase Auth; an editable display name/email is never authorization. This grants no member, coach or app-owner role. The workout app and production database are separate.

The storage banner must say **Connected to private hosted workspace**. Decisions, additional reference images, versions and audits then save centrally. Use **Refresh workspace** to load other computers' changes. Unsaved note text stays on its browser until submitted. The demonstration remains first, Your review second, references third; secondary panels start collapsed. Review approval still does not integrate artwork or publish the app.

## Other agents and computers

### Fresh-computer setup

Install Git and a current Node.js LTS release, then clone the development source:

```powershell
git clone --branch dev https://github.com/knitko95/strong-start.git
cd strong-start
```

If the repository already exists, read its `AGENTS.md`, inspect its branch and dirty state, and follow the dev-first workflow without overwriting local work. Read-only remote CLI use does not require installing npm packages or running a local server. Start by reading `AGENTS.md`, this guide, and the applicable coordinator/generator/auditor instructions.

The owner must create an agent credential and save it privately on that computer. If you were not given its file location, ask for the **file path**, not the secret. Do not use the owner's browser session or initialize a local workspace as a fallback. The initial `list` command below is the connection check: it should return the shared exercise records. A 401 means the credential needs correction, renewal or replacement; do not proceed with writes until access works.

An owner opens **Agent access** and creates a distinct named credential for each generator/auditor. Save the one-time credential privately on that agent's computer, outside Git, public exports and chat messages. Credentials expire after 30 days and can be revoked or replaced immediately. They can read source evidence, claim exercises, upload immutable files, register candidates and submit independent audits. They cannot approve artwork, impersonate a different worker, change publication pointers or manage access. Do not copy browser login cookies to agents.

```powershell
node scripts/pose-review-remote.mjs list --url https://dev.strongstart.app --credential-file PRIVATE_FILE
node scripts/pose-review-remote.mjs get --id EXERCISE_ID --credential-file PRIVATE_FILE
node scripts/pose-review-remote.mjs claim --id EXERCISE_ID --batch BATCH --expected-revision REVISION --credential-file PRIVATE_FILE
node scripts/pose-review-remote.mjs fetch --path REGISTERED_OR_ORIGINAL_SOURCE_PATH --out PRIVATE_FILE --credential-file PRIVATE_FILE
```

Run `node scripts/pose-review-remote.mjs --help` for candidate/audit/release/upload/export arguments. Credential identity supplies the worker name; separate credentials are required for independent review. Read current revisions before writes. A stale write returns 409 and must be reread/reconciled; never force an old snapshot over a newer owner decision. Claims are explicit and do not expire automatically; coordinate abandoned assignments through the private tracker.

Read full current exercise notes and all limitations, exact variation, source register, approved instructor artwork, owner correction notes and actual reference images before generation. Fetch each version's `/workspace/ID/versions/VERSION/generation.json` to inspect its prompt/sourceReview chain. Original absolute paths in migrated provenance are keys into the private file manifest, not a requirement to have the original Windows filesystem. Fetch them with `fetch --path`. New supporting files should use `upload`'s content-addressed archive path and record the returned path/hash in the brief. Never claim a linked video was watched merely because its page/still was fetched.

Registering a candidate uses uploaded frame hashes and dimensions; it keeps previous versions and approvals and returns the new pair to unreviewed. Audit identity comes from the credential and must differ from the generator. Owner decisions remain exact-version/fingerprint-bound browser actions. Neither an audit pass nor an agent credential authorizes a release.

## Storage and operations

`strong-start-dev` alone binds private D1 metadata and the Standard-class `strong-start-pose-review-private-dev` R2 bucket. Public bucket access is disabled. The Worker authenticates every private image/source request; file URLs are not public share links. Objects are keyed by SHA-256 and never replaced. Record updates compare revisions atomically in D1; a trigger archives each previous record revision. Uploading files before a failed registration can leave unreferenced objects; retain these rather than deleting evidence automatically.

Owner allowlists live in private D1 settings. Browser sessions are opaque, hashed, HttpOnly/Secure/SameSite cookies with one-day expiry. Write requests require the same origin and session CSRF value. Agent credentials are hashed, revocable and role-limited. No private records, supplied photos, tokens or migration manifests belong in this public repository or static asset build. Production imports no authoring backend or bindings.

The initial migration uses a separate temporary bootstrap credential. It registers private objects and exact unchanged records, checks original source hashes, then downloads and hashes every distinct object. It refuses conflicting existing records. Disable the bootstrap after verification. Keep the local source/archive and the private migration manifest/report as recovery evidence; do not delete them after cutover. The archived local workspace is no longer an active editing queue after cutover.

`prepare-pose-migration.mjs` creates the private manifest; `migrate-pose-workspace.mjs` uploads/resumes and verifies. They must target the explicit private development resources, never the workout production database. Browser **Export reviews** exports metadata/history only, not image bytes. A full backup must also enumerate/download the authenticated file manifest and retain hashes. R2 objects alone cannot restore review decisions; preserve D1 records/revisions too.

R2 storage and requests, D1 usage and Worker requests have separate allowances. Preserve failed attempts and approved masters; deduplicate identical content rather than silently pruning history. Monitor account usage before large future imports. Changes remain subject to dev-first testing and exact production release approval; deploying authoring on dev does not publish exercise artwork in the live workout app.
