# Test-app usage analytics

This candidate adds explicit opt-in PostHog events to dev only. Production
configuration is disabled, including when the production build is served locally.
No database migration or Auth change is required.

## Configuration

Set `POSTHOG_DEV_PROJECT_TOKEN` (public ingestion token, never a personal API key)
and `POSTHOG_DEV_HOST` on the **strong-start-dev build trigger**. Local builds can
read the ignored `.env.analytics.local`; see `config/analytics.env.example`.
Only the dev build substitutes configuration into the page. Dev1/dev2 are off.
Missing configuration keeps the app usable and shows a connection notice.
The public static bundle necessarily contains the ingestion token.

The PostHog project named Strong Start is reserved for development. Its plan
currently permits only one project; the initially empty Default project was
renamed. Future production analytics needs a reviewed isolation/retention plan.
Project settings disable IP storage, autocapture, replay, console and network
capture. The explicit ingestion API is used without a third-party browser SDK,
so no automatic page URLs, referrers, DOM content or error payloads are collected.

## Choice and data

A card on Today/setup asks permission. Settings → Account & backups always
offers the choice. It is off until allowed. Consent is browser-wide on this test
origin and does not sync. Turning it off immediately stops subsequent requests.
Already received events remain subject to PostHog retention; account deletion
cannot automatically locate session-only identifiers. Privacy text discloses this.

Events use a random page-session ID, rotated on account changes/reload. No
account ID, email, name, inputs, exercise IDs, workout IDs, weights, health
answers, messages, URL/query/hash, or invite information is sent. Coach preview,
signed-out/gated/recovery/deleting accounts and production are excluded.
The account ID is compared locally solely to reset the random identifier.
No identity is persisted, so cross-session retention and unique-member counts
are intentionally unavailable. Small beta samples are not anonymous guarantees.

## Event contract

All events include environment, version, build, variant and a bounded screen name.
Selected actions have `action_pressed` and `action_rendered`; only allowlisted
action names pass, never button text or data attributes. `decision_ms` measures
active foreground time since the current screen/step became ready. Rerenders
of the same step preserve it. Background time is excluded. Workout phase time
includes exercise/rest; do not interpret it as hesitation. `response_ms` estimates
time to a rendering opportunity after the press, not network completion or success.
`from_screen` retains the originating screen for response events.

Confirmed lifecycle events: `setup_step_completed`, `setup_completed`,
`setup_paused`, `workout_started`, `workout_resumed`, `workout_paused`,
`set_logged`, `workout_saved` (complete/partial), `swap_applied`,
`instructions_opened`, and a narrow set of `settings_changed` actions.
These reflect client behavior; saved does not certify cloud sync.

Funnel drop-off means no subsequent event within the chosen window. It cannot
prove abandonment: opt-outs, reloads, blockers and offline gaps also break paths.
Requests are best effort, without durable offline queues or retries. Analytics
failure never delays saving or workouts. HTTP receipt and queryable ingestion
are separate checks. Synthetic ingestion checks use variant `analytics-verification`.

## Checks

`node scripts/build-dev.mjs` runs existing syntax, environment, persistence and
offline checks. `node scripts/test-analytics.cjs` verifies minimization, consent,
foreground timing, account boundaries, delayed callbacks, disabled/missing
configuration and network failure. `node scripts/test-analytics-browser.cjs`
uses synthetic state and intercepted events at desktop and 390/320px widths.
Passing a hosted URL verifies that same affected flow without database writes.
Native-phone and real-account tests remain separate.

Official API reference: https://posthog.com/docs/product-analytics/capture-events
