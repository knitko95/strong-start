# Apple Sign-In and account linking — November 15, 2026

Development-only candidate. Production is unchanged. No database migration,
data-schema change, role grant, or account merge is included.

## Setup before real-provider testing

The development project is **strong-start-dev**, ref `gvyfgqhgqnfmtoytqpeo`.
Public Auth settings checked November 15 show Google enabled and Apple disabled.
Apple Developer setup has not yet been completed. Manual linking availability
cannot be determined from the public settings response and remains unverified.

1. In an Apple Developer account, configure Sign in with Apple for a primary App ID
   and a web Services ID. Register `dev.strongstart.app` as the web domain and
   `https://gvyfgqhgqnfmtoytqpeo.supabase.co/auth/v1/callback` as the return URL.
2. Configure that Services ID and the Apple client secret in the **development**
   Supabase Apple provider. Keep signing keys and secrets out of Git, chat and the
   frontend. Apple’s web OAuth secret needs periodic rotation; follow the current
   provider guide and record its actual expiry in private operational records.
3. In development Auth settings, enable manual identity linking. Confirm the
   redirect allow-list includes `https://dev.strongstart.app/`. Do not enable
   anonymous accounts or change invite/approval rules.
4. Reload the test app. Apple becomes available when the backend reports it enabled.
   Sign into an existing synthetic test account, open Sign-in methods, connect Apple
   with Hide My Email, and confirm that the Auth user ID, plan, history and draft
   stay the same. Sign out only after Synced, then test both providers and reload.
5. Test cancellation, a provider already attached to a different account, and
   disconnect/reconnect with another working method. Verify Google/email access
   for existing accounts and the invite-only/disabled-account boundaries. For staff,
   retain the verified Google identity; linking does not assign a role or substitute
   a typed email for trusted Auth identity verification.

Apple account/credential entry is an owner setup step. Production Auth settings
and publishing require approval of a defined tested release separately.

## Implementation boundaries

Supabase `linkIdentity()` and `unlinkIdentity()` retain the existing user ID.
The methods sheet fetches a fresh Auth user and derives identities from that
response. It never matches accounts by a typed email or writes identity rows.
App state, workout logs, invites and role tables use their existing paths.

Connect drains pending device/cloud writes before OAuth. An environment-prefixed,
tab-scoped sessionStorage marker contains only the expected user ID, provider and
start time. On return, a fresh Auth user must have that ID and identity. A mismatch
blocks normal account loading, signs the unexpected session out locally and keeps
the original device copy for recovery. A same-ID Auth event updates the identity
object without resetting workout state. A genuinely different ID clears cached
access/role flags before normal access checks.

Disconnect reloads identities before mutation, confirms the request, and requires
another enabled OAuth provider or a verified email identity. Supabase also enforces
its own identity-count restriction. Google cannot be removed through this UI from
coach/owner accounts. All account actions reject coach preview. No permission
policy or role membership is changed; this is not a broader staff-permission audit.

## References

- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Apple provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)
- [Apple Hide My Email](https://support.apple.com/en-us/105078)

## Verification limits

The development build passed syntax/environment isolation, release/build identity,
108 persistence/workout scenarios and eight offline scenarios. Focused Chromium
checks passed at 1280, 390 and 320 px with a synthetic Auth transport: provider
availability, escaped identity addresses, different emails, connect API/redirect,
save-before-redirect, disabled/manual-linking and duplicate errors, cancellation,
same-ID identity refresh, wrong-ID return rejection, retained workout objects,
disconnect confirmation, verified-email fallback, last-method protection, staff
Google retention and coach-preview rejection. Existing account deletion and
Settings navigation/persistence checks also passed at all three widths. No
unexpected console/page errors were observed in those checks.

Synthetic browser checks cover the frontend and its Auth API calls; they cannot
establish successful Apple configuration or a completed real OAuth exchange.
Real Apple/Google linking, manual-linking configuration, native iPhone/Home Screen
behavior and physical-device testing must be verified after provider setup.
