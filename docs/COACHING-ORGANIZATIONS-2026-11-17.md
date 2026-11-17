# Coaching organizations on development

Implemented November 17, 2026. Development only until the owner approves a defined tested release. No production role or account changes are implied.

## Model and authority

Each staff account belongs to one organization. Its coaching role is `coach` or `lead`, with an independent `is_admin` capability. A coach may also be an admin. A member's primary coach is `profiles.invited_by`; an original invite retains its creator in `invites.created_by` after a transfer.

Coaches can review/send plans and converse with their direct members. Lead coaches have the same access across the recursive reporting chain. Admins oversee all member records within their organization and manage roles, reporting lines, member transfers and eligible account actions. None of these roles exposes another staff account's personal workout state/history. Existing global app-owner access to historical app feedback remains separate.

New staff must already be approved members of the organization with a confirmed Auth email and trusted Google identity. Adding staff preserves personal data, grants the base coach role only, sends no email and creates no login. Lead/admin changes require a current organization admin. No self-promotion, cross-organization target or reporting cycle is allowed. Reassign reporting coaches before demoting a lead. At least one active admin must remain.

## Database/API

Migration `20261117191817_coaching_organizations.sql` follows `20261117163123_isolate_coach_members.sql`. It creates `private.coaching_organizations`, `private.coaching_staff` and `private.coaching_audit`. They have RLS and no ordinary client table/sequence privileges; no broad policies are needed. Only the guarded RPC exposes organization data. Existing coaches enter one named organization with admin access off. Assigning the first admins requires a separately authorized provisioning operation verified against trusted Auth IDs/providers; portable SQL contains no personal identity literals. Follow-up migration `20261117193954_guard_staff_promotion_updates.sql` cancels queued, unapplied member-plan updates when an account becomes a coach, preserving its already-saved personal plan and history.

`coaching_organization(p_action,p_target,p_data)` provides:

- `summary`: current organization/self context, permitted staff directory and member assignments, plus the latest 30 audit entries for admins.
- `add_coach`: existing approved Google member's email; membership and provider identity are verified server-side.
- `update_coach`: role, separate admin flag, manager, and the expected previous values. Stale changes fail before writing.
- `transfer_member`: target member, new primary coach and expected previous coach. It preserves saved state/history/messages and cancels all unapplied plan updates for the old assignment.

Organization mutations lock the organization row before rechecking admin authority. This serializes final-admin counts and manager/assignment changes. Conversation operations take the same organization lock in shared mode before profile locks. Helpers use the authenticated subject, not editable metadata. Member profile column grants still prevent direct assignment changes.

The conversation API preserves its existing interface. It now reads member history across same-organization primary-coach threads and labels each sender. Access follows the current primary coach/team, so an old ordinary coach loses access immediately after a transfer; an admin/supervisor can retain access through that separate role. The member-facing disclosure lists everyone currently authorized. A team read receipt indicates that someone on the authorized team read the member's message; team messages are marked read by the member. Shared Needs reply state is resolved only through the message version opened by a staff responder.

## Interface

Profile & settings opens Your people, Your coaching team or Your organization according to the current role. Members remain the default list. Leads/admins have Coaches; admins also have Activity and Add coach. View members drills into one staff account without displaying its personal training. Edit access and Change coach require a separate review/confirmation step. Invites remain scoped to their creator.

Frontend organization state is account-scoped and cleared on account switch/sign-out. Generations reject late responses and stale modal actions. The database remains authoritative if an old page still displays controls after access changes. Refresh reloads the organization and current member scope.

## Verification and limits

`scripts/test-coaching-organizations.sql` uses rolled-back synthetic Google identities, two organizations, coaches, nested leads, admins and members. It checks role scopes, staff personal privacy, cross-organization denial, provider checks, self-promotion/cycle/final-admin/stale-value guards, promotion, transfers with retained conversations and revoked old-coach access, queued-plan cancellation, invites, audit and anonymous denial. Existing member-isolation and coaching-message SQL suites use organization fixtures and remain executable. No real member transfer or account deletion is used as a test.

`scripts/test-coaching-organizations.cjs` checks the actual frontend with synthetic RPCs at 1280, 390 and 320 pixels: role/admin/reporting edits, confirmations/cancellation, transfers, coach addition, activity, scoped coach/lead controls, escaping and late account-response rejection. Existing messaging, member-list and settings-navigation browser suites cover their affected paths. Builds also run state/workout and offline regressions. Hosted verification must confirm the exact candidate SHA and development backend after deployment.

Security advisors report the intentionally closed role/private tables and authenticated guarded SECURITY DEFINER RPCs. These findings need review against actual grants/functions; they do not justify exposing the tables. Leaked-password protection remains a pre-existing Auth warning. Advisor review and tests are not a full security certification.

Real Google login and physical iOS/Android interaction are separate owner checks. Browser tests use synthetic sessions; SQL tests exercise actual development permissions. Large-organization load and real concurrent user sessions are not claimed verified. No automatic production schema/role promotion exists. A future production release requires the reviewed migrations and separately approved production admin provisioning, not a database copy.
