# Using Strong Start

Reviewed against source commit `149f807bd8e67c7c95204157e07e33e1202763a7` on November 11, 2026. This guide describes implemented behavior. See the dated review for what was actually exercised.

## Trying changes before release

Use [the testing app](https://strong-start-dev.pages.dev/) to review changes from `dev`. Its Testing banner identifies the separate environment. Sign in separately; test accounts, plans, workouts, messages, and invites do not transfer to the [live app](https://knitko95.github.io/strong-start/). Do not restore a real member's backup into testing.

Changes are built and tested on dev first. The agent will provide the tested changes, results, and any database changes for your review. The live app is updated only after you explicitly approve that release. Asking for a feature or fix, or approving a previous release, does not approve a new live release. See [the release process](ENVIRONMENTS.md).

## Joining and signing in

1. Open the coach's invite link in the browser where you intend to create your account. Each invite works once and normally expires after 14 days. The app also accepts a pasted invite link or code through **I have an invite**.
2. Create an account with Google or an email address and password of at least eight characters. Google is offered when enabled in the Supabase project's public Auth settings. Returning users sign in to their existing account; already-approved users do not need a fresh invite.
3. A cancelled, expired, or already-used invite needs attention from the coach. A disabled account sees **This account is paused**. **Check again** retries access; it does not reactivate the account.
4. Use **Forgot your password?** for the email reset flow. Finish it on the link's destination page. Do not create a second account to recover an existing one.

The ordinary guest button is hidden during beta. Local-only handlers/storage remain for older local sessions and fallback behavior, not as the normal new-user workflow.

## Putting it on a phone

The app fits the phone's width and scrolls vertically. The bottom menu stays fixed, with extra clearance for rounded edges and the home indicator; it remains hidden during setup and the focused workout flow. Touch zoom is restricted where the browser allows it, though browser accessibility settings may override this. Form fields use at least 16px text on phones to avoid focus zoom.

After sign-in, supported phone browsers show Home Screen instructions before setup. On iPhone/iPad, use the browser's Share menu and **Add to Home Screen**. On Android, use **Install Strong Start** if available or the browser's install/Home Screen menu. Browser versions can change the exact controls.

The iPhone Home Screen app may require signing in again because its sign-in storage is separate from Safari. A skipped installation screen can be revisited from the reminder on Today; dismissing that reminder hides it for a week. Desktop and standalone sessions do not show the same prompts.

Offline files download automatically during an online visit; there is no Offline access card in Settings. Sign in and load your plan first, and allow the download to finish before going offline. Once cached, the app can reopen, log sets, and resume a saved workout without the app server. Account sync, sign-in, messages, and coach updates still need a connection. Reconnect and check **Synced** before relying on another device. Clearing browser data or browser storage eviction removes offline files and local data, so another online visit is needed afterward. A Home Screen installation may need its own first online visit. Background/locked-screen timer accuracy still depends on the phone.

## Setup

New users have eight screens: optional profile details, goals, training places, equipment confirmation, experience and equipment comfort, limitations, schedule, and first-week preview. Equipment presets show a compact selected list with **Change equipment** for the full checklist; every selected place must be confirmed. Age, body weight, and gender are behind an optional disclosure. Colors and detailed exercise/cardio preferences can be changed later in Settings. New plans initially use suitable exercises for the available equipment, a walking warm-up, and no additional cardio after lifting. A short first-workout guide appears on Today.

Existing in-progress setups keep their longer question flow and saved answers. Pausing a new setup before plan review saves the checkpoint without generating an unchecked plan.

If you pause setup and update your information in Settings, those saved changes carry into the paused answers. Once you have a plan, goals, training places, experience/comfort, and a valid schedule saved, a Settings change clears **Finish setting up** without rebuilding your plan or resetting progress. If setup is still incomplete, Continue keeps your saved information and unfinished answers.

The full legacy/edit flow also offers detailed training-history, color, and cardio questions. Some questions depend on earlier answers.

- Goals: lose weight, build muscle, get stronger, feel healthier, or athletic performance.
- Places: gym, full-size gym, home, apartment/hotel gym, or anywhere. Check actual equipment at each place; presets are starting selections.
- Levels: Just starting, Getting back into it, Training regularly, and Leveling up. Experience answers suggest a level, which the person can change.
- Schedule: two to five fixed weekdays or a flexible number of workouts per week. Session lengths are 30, 45, 60, or 75 minutes; optional cardio after lifting is additional.
- The first selected place is the main place used to build the plan. Switching places on Today adapts unavailable exercises where a suitable alternative exists; slots may be absent where there is no candidate.

Body-weight entry uses the same range in setup, Settings, and weigh-ins: 40–900 lb (18.14–408.23 kg at display precision). Setup and Settings allow a blank value; weigh-ins require a value. Invalid entries show an error and leave the saved weight intact.

Review the proposed first week, then choose **Looks good, let's go**. **Save and finish later** saves partial setup and provides Continue on Today. New questions can appear later as one-time prompts without a complete setup restart.

## The five main tabs

| Tab | What to do there |
| --- | --- |
| Today | See weekly/program progress, next workout, active-workout Resume, coach notes, check-ins, and weigh-in reminders. |
| Plan | Review the week, muscles trained, exercise targets, and persistent swaps/adjustments. |
| Library | Search names/muscles and filter by equipment, body part, or movement. Equipment/level filters affect what is shown. Tap anywhere on an exercise row (marked with ›) to open **How to do it**, with the same steps, equipment list, and muscle diagrams available in workout previews. Closing the instructions returns to the library with your filters kept. |
| History | Review saved sessions and exercise progress; expand a session for details. |
| Settings | Change profile, goals, schedule/split/order, places/equipment, level/limitations, exercise choices, cardio, weigh-ins, timers, program, account, and backup. |

## Doing a workout

1. Tap a workout on Today. The preview shows exercises, estimated time, warm-up, and cool-down. Browsing this screen does not start a workout. Use **Reorder**, **Swap**, or an exercise's **How to do it** when needed.
2. Choose **Start workout**. Follow the timed warm-up, then the exercise flow. A list view and workout-list menu let you navigate between session parts.
3. Enter actual weights and reps (or seconds), then mark a set done. Weight defaults are suggestions. Per-side and added-weight labels matter; follow the displayed instructions.
4. Rest timers can start after sets; recovery timers can appear between exercises. **Too easy** / **Too heavy** feedback and completed sets influence future targets. Skipped/unchecked sets do not count as completed work for progression.
5. Use the pause/end control to **Take a break**, **End workout**, or **Discard**. Pausing preserves the draft and adds Resume on Today. Reloading can reopen the draft automatically. End saves completed work. An unfinished session is labeled **Partial**, shows completed/planned sets, and stays available through **Resume remaining sets** on Today, including after a reload. Finishing the remaining sets updates the same history entry. Discard throws away unsaved work after confirmation; an already-saved partial history entry remains.
6. Complete the cool-down and choose **Finish workout**. At least one checked set with a positive rep/seconds value is required. The summary explains next targets and history receives the session. Only a session with all planned working sets finished counts toward weekly completion; repeating the same workout does not inflate that count. Warm-up/cardio/cool-down are not counted as working sets. Older logs without completion metadata retain their existing completed status. Signed-in users can send a separate coach message from the summary.

Changing the set count with **Adjust** or **+ Set / − Set** updates the current workout’s completion requirement. Completed sets are preserved when reducing the target. Skipping an exercise still leaves its unfinished sets available to resume. Resetting an adjustment restores the default set requirement.

Persistent swaps change the plan from then on. A **today only** substitution or a change caused by another training place is different. Read the sheet before confirming. **Adjust** changes the slot's sets, range, rest, recovery, or working weight. **Reset adjustments** restores the app's default set/rep/rest/recovery targets for that exercise; it does not restore an earlier coach version or change the working weight.

## Progress and programs

Programs last six weeks, measured from the program start date. Targets depend on experience, goals, completed work, and difficulty feedback. Beginner/returning users have easier introductory weeks; older beginners can have a longer easing period. The app offers later check-ins and suggestions to adjust workload.

At the end of a program, Today offers **Start the next program**. Settings also lets the person start early, restart week 1, or return to a stored previous program when available. Starting a new program carries exercise progression forward; the variety setting governs which exercises change. It is a user action, not an automatic calendar reset.

Weekly weigh-ins are optional and can show a trend while hiding the number. A saved weigh-in also updates the body-weight setting used by starting-weight suggestions.

## Saving, changing devices, and backups

The app saves a browser copy and, when signed in/connected, syncs to Supabase. The tappable indicator appears in the app header and during workouts: **Saved on device**, **Sync pending**, **Syncing…**, **Synced**, **Sync failed**, or **Device save failed**. Tap for an explanation and **Retry sync** when signed in. A device save is separate from account sync; a storage failure requires keeping the page open and copying a backup. Coach messages, invites, and other network actions are not a durable offline outbox.

On dev, sign in to the same account on another device to retrieve its data. Independent workout entries are combined. If both devices change the plan/settings/active workout, or edit the same history entry differently, saving pauses with **Review sync conflict**. Tap the save indicator, copy both versions if needed, then choose **Keep this device’s version** or **Use account version**. The choice applies to conflicting data; independent workouts are retained and deleted workouts stay deleted. Plan/settings/progression are chosen together, not merged field by field. You can decide later and keep working locally, but cannot sign out until the conflict is resolved.

The latest resolved conflict remains available through the save indicator’s **Copy last conflict recovery** until another conflict is resolved, you switch accounts, or sign out. Keep a private copy before those actions if needed. The first sync after upgrading may ask you to choose between differing older device/account copies because no shared baseline was recorded previously.

Use **Settings > Backup > Copy backup** to keep a personal copy. **Restore my backup** replaces state/logs after confirmation. The signed-in warning explains that the replacement syncs to the account and other devices and may remove account workouts missing from the backup. Back up first and use only the intended person's data. On dev, an explicit restore gives imported workouts new internal IDs, so intentionally restored sessions can be saved even if their original copies were deleted. An ordinary reconnect does not restore deleted history. Do not paste a real backup into a public issue or repository.

Changing lb/kg converts working weights, previous sets, historical set/planned weights, body weight, weigh-ins, and active/saved drafts. Display values are rounded to two decimals; stored conversion values retain more precision. Version 6 records units explicitly. Legacy values are assumed to use their saved profile unit: incorrect unit switches made before this fix cannot be reconstructed automatically. Historical free-text progression notes retain their original explicitly written units.

Sign-out flushes queued and in-flight changes before clearing the local cache. If syncing fails, sign-out stops and the device copy is retained; retry sync and keep a backup if problems remain. Signing out clears the cached plan/history from that browser. It does not delete the account.

On dev, **Settings > Account > Delete my account** permanently removes the login, plan/settings, workouts, and coach messages. Copy a backup first if wanted, then type **DELETE** and confirm. Cancel is focused initially. A sign-in within the last ten minutes is required; if asked, cancel, sign out, sign in again, and return to the deletion screen. Paused and not-yet-invited accounts can also delete from their account screen. Coach and owner accounts must arrange deletion with the app owner. Joining again requires a new beta invite.

App feedback remains to help improve the app, with its profile link and workout reference removed. Its text and screen/device context remain and may identify the sender; contact the app owner to request removal of retained feedback. Successful deletion clears this browser's account copy. Other devices can retain offline copies until they reconnect; a connected current dev client removes its copy when account sync confirms the account is gone. Backups copied elsewhere are not erased.

## Feedback and coach tools

Signed-in users can choose **About the app** (owner inbox) or **To my coach** (shared coach inbox) in Feedback. Authorized coaches can read the coach inbox; messages are not private to one assigned coach. App feedback includes screen/device context; a coach message can include a small workout reference. This is an inbox workflow, not a live conversation or automatic plan edit.

On dev, the old copy-and-text progress report flow has been removed from History, program completion, and workout instructions. Once a signed-in person's workouts have synced, their coach can review them through **Your people**; no separate report is needed. Personal backups remain under Settings. This cleanup is awaiting approval for the live app.

For a coach, **Settings > Your people > Open** shows approved people's activity, pending updates, messages, and invites.

- **Invite someone** creates a one-use link. Copy/share it deliberately with its intended recipient. A waiting invite can be cancelled.
- **Open their app** loads a person's plan/history into a temporary coach view. The banner identifies whose app is being viewed. Edits are not saved automatically.
- Change exercise choices, set/rep/rest/recovery targets, or level, then **Send changes** with an optional note. Profile, schedule, equipment, and working weights are view-only. Coach view does not offer workout recording, history deletion, backup restore, or program restarts. **Preview at** changes the displayed location only; it is not sent to the member.
- The recipient applies pending updates after opening/syncing when a plan exists and no draft is active. A paused draft also postpones application. On dev, the changed plan and its acknowledgement are saved together; an interrupted save is retried without consuming an unsaved update. **Back to my app** restores the coach's view and discards unsent preview edits.
- Inboxes support marking items done. Loading an inbox marks loaded unread entries read. Only the owner sees app feedback; coaches see coach messages according to their roles.

App owners can manage eligible non-staff accounts from Your people. **Disable** preserves data and pauses access; **Turn back on** reverses it. **Delete** permanently removes the account and related workout/plan data after typing the person's name/email. Staff/self-deletion are guarded. App feedback remains with its profile reference removed and workout reference cleared; its free text can still identify someone. Do not use deletion as a test.

See [architecture](ARCHITECTURE.md) for permission boundaries and [the review](REVIEW-2026-11-11.md) for outstanding reliability/validation work.

## Dialog accessibility

Dialogs have accessible names, place focus inside on opening, keep Tab/Shift+Tab within the dialog, and close with Escape. Closing restores focus to the opening control (or a nearby page heading if it no longer exists). The underlying page is temporarily inert. Confirmation dialogs initially focus Cancel. Touch zoom restrictions and safe-area layout are preserved.
