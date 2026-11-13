# Strong Start: Claude instructions

@AGENTS.md

`AGENTS.md` is the shared source of project rules. Read and follow it before working on this app. It retains the original owner decisions about approved changes, production publishing, private data, coach access, testing, and preserving existing users' data.

All changes must be made and tested on `dev` first. Deploy and verify the test version, then obtain the user's explicit approval of the tested release before merging/pushing to `main` or changing production Supabase/Auth/configuration. A request to implement a change is not approval to release it. Follow the full approval scope and verification rules in `AGENTS.md`.

For task-specific context, read:

- [Feedback workflow](docs/FEEDBACK_WORKFLOW.md): private tracker access, triage, issue claims, handoffs and intake from both apps. Read the private tracker at session start; the public feedback log is historical only.
- [App guide](docs/APP_GUIDE.md): member, coach, and owner workflows.
- [Architecture and operations](docs/ARCHITECTURE.md): code map, saving, permissions, testing, deployment, and recovery.
- [Environments and releases](docs/ENVIRONMENTS.md): dev hosting/database, validation, and the explicit production approval step.
- [Review dated 2026-11-11](docs/REVIEW-2026-11-11.md): findings, evidence, and checks still open.

Keep shared rules in `AGENTS.md` so Claude and other agents stay aligned. The retired Claude artifact is not the source of this app.
