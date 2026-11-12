# Using Strong Start

Reviewed against source commit `149f807bd8e67c7c95204157e07e33e1202763a7` on November 11, 2026. This guide describes implemented behavior. See the dated review for what was actually exercised.

## Trying changes before release

Use [the testing app](https://dev.strongstart.app/) to review changes from `dev`. Its Testing banner identifies the separate environment. Sign in separately; test accounts, plans, workouts, messages, and invites do not transfer to the [live app](https://strongstart.app/). Do not restore a real member's backup into testing.

Changes are built and tested on dev first. The agent will provide the tested changes, results, and any database changes for your review. The live app is updated only after you explicitly approve that release. Asking for a feature or fix, or approving a previous release, does not approve a new live release. See [the release process](ENVIRONMENTS.md).

## Joining and signing in

The public sign-in page describes workout planning, exercise instructions, tracking and coach messages before sign-in. **Privacy policy** and **Terms of Service** stay visible in a footer at the bottom of the screen while the sign-in content scrolls; the account card in Settings also links to both. These pages were approved and published November 11; Google branding is verified; publishing the approved branding is pending. This update adds no age gate, consent checkbox or change to account access.

1. Open the coach's invite link in the browser where you intend to create your account. Each invite works once and normally expires after 14 days. The app also accepts a pasted invite link or code through **I have an invite**.
2. Create an account with Google or an email address and password of at least eight characters. Google is offered when enabled in the Supabase project's public Auth settings. Returning users sign in to their existing account; already-approved users do not need a fresh invite.
3. A cancelled, expired, or already-used invite needs attention from the coach. A disabled account sees **This account is paused**. **Check again** retries access; it does not reactivate the account.
4. Use **Forgot your password?** for the email reset flow. Finish it on the link's destination page. Do not create a second account to recover an existing one.

The ordinary guest button is hidden during beta. Local-only handlers/storage remain for older local sessions and fallback behavior, not as the normal new-user workflow.

## Putting it on a phone

The live app is now [strongstart.app](https://strongstart.app/). Use your existing account there after checking that the old GitHub Pages app says **Synced**. An unfinished workout saved only in the old browser/app does not move automatically. The new address needs its own Home Screen installation; keep the old one until your account data is verified. See [transition details](DOMAIN-TRANSITION-2026-11-11.md).

The app fits the phone's width and scrolls vertically. The bottom menu stays fixed, with extra clearance for rounded edges and the home indicator; it remains hidden during setup and the focused workout flow. Touch zoom is restricted where the browser allows it, though browser accessibility settings may override this. Form fields use at least 16px text on phones to avoid focus zoom.

After sign-in, supported phone browsers show Home Screen instructions before setup. On iPhone/iPad, use the browser's Share menu and **Add to Home Screen**. On Android, use **Install Strong Start** if available or the browser's install/Home Screen menu. Browser versions can change the exact controls.

The iPhone Home Screen app may require signing in again because its sign-in storage is separate from Safari. A skipped installation screen can be revisited from the reminder on Today; dismissing that reminder hides it for a week. Desktop and standalone sessions do not show the same prompts.

Offline files download automatically during an online visit; there is no Offline access card in Settings. Sign in and load your plan first, and allow the download to finish before going offline. Once cached, the app can reopen, log sets, and resume a saved workout without the app server. Account sync, sign-in, messages, and coach updates still need a connection. Reconnect and check **Synced** before relying on another device. Clearing browser data or browser storage eviction removes offline files and local data, so another online visit is needed afterward. A Home Screen installation may need its own first online visit. Background/locked-screen timer accuracy still depends on the phone.

## Finding your settings

On the test app, Settings opens with four categories instead of one long list. **Your training** contains goals, schedule/split/workout order, places/equipment, level/limitations and the 6-week program. **Workout preferences** contains exercise choices, cardio and timers. **Profile & appearance** contains personal details and units, a separate Appearance section for app colors/light/dark, and weekly weigh-ins. **Account & backups** contains account access, policy links and copying/restoring a backup. Tap a category, then expand the setting you need; **All settings** returns to the overview. Coach messages and **Your people** appear at the top of that overview, above the categories, for accounts that already have access. Coach member-preview restrictions are unchanged.

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
| Today | Compact week/workout progress, one main View workout or Resume card, a collapsed Other workouts list, then compact reminders. View workout opens the preview before starting; a paused/partial workout takes priority. Coach messages appear only when unread, with read/dismiss actions retained. |
| Plan | Review the week, muscles trained, exercise targets, and persistent swaps/adjustments. |
| Library | Search names/muscles and filter by equipment, body part, or movement. Equipment/level filters affect what is shown. Tap anywhere on an exercise row (marked with ›) to open **How to do it**, with the same steps, equipment list, and muscle diagrams available in workout previews. Closing the instructions returns to the library with your filters kept. On dev, exercises matching pain areas selected in Settings have an amber warning bubble to the left of the name. Their how-to cards identify the affected areas in a warning above the steps. These use the same matches as plan exclusions; turn off **Only moves that fit your level** to browse excluded exercises. Unmarked exercises are not a guarantee of pain-free movement. |
| History | Review saved sessions and exercise progress; expand a session for details. |
| Settings | Change profile, goals, schedule/split/order, places/equipment, level/limitations, exercise choices, cardio, weigh-ins, timers, program, account, and backup. |

## Exercise demonstrations

The development exercise text has undergone a NASM reference audit with corrections to six cues and shared instructions for timed movement, power exercises and warm-ups. Reference coverage is incomplete and some NASM pages contain conflicting information; this is not professional technique certification. See the [audit, sources and remaining limits](EXERCISE-AUDIT-2026-11-11.md).

On the test app, the how-to cards for Dumbbell Romanian Deadlift, Hammer Curl, Standing Dumbbell Shoulder Press, Dumbbell Bench Press, Plank, Goblet Squat, Incline Dumbbell Press, Dumbbell Floor Press, Seated Dumbbell Shoulder Press, Dumbbell Lateral Raise and Single-Arm Dumbbell Bench Press include the reviewed rose-top 3D demonstration. Drag to rotate, scroll or pinch to zoom, pause, choose half speed, or use Front/Side/Back and Reset view. Side faces right. The demonstration loads when its how-to opens; the written steps remain available when 3D cannot load or the device is offline. The standalone bodyweight squat reference is not attached to a library exercise. These eleven demos are enabled only in development; see [the registry and verification record](EXERCISE-GUIDES-2026-11-11.md).

## Exploring the muscle map

On the test app, each workout group on Plan is a collapsed dropdown. Its name, focus and time remain visible; expand it to see exercises and use Adjust or Swap. Groups open independently and stay open while making adjustments during the page session.

On the test app, **Why your plan looks like this** is a collapsed dropdown at the bottom of Plan, after the workouts. Open it to read the existing explanation of your goals, reps, rest and progression. It no longer appears on Today.

On dev, **Plan > Muscle map** shows the week's planned training on front and back diagrams. Tap a muscle, or use **Choose a muscle** to open the large-button list grouped into Upper body, Core, and Lower body. Choosing a name closes the list, highlights the muscle, and shows its primary and secondary exercises and estimated weekly sets. The list scrolls on shorter screens. Browsing the map does not change your plan or workout progress.

After selection, the muscle's name becomes the outlined selector button (for example, **Quads ⌄**), with estimated weekly sets beside it. Tap that button to choose another muscle; there is no separate repeated muscle heading.

## Doing a workout

On dev, workout screens account for the Testing banner and phone safe areas before positioning the bottom buttons. Longer screens scroll normally, with space below the controls. See the [spacing and screen coverage review](WORKOUT-LAYOUT-2026-11-11.md) for the remaining differences between the older screens and the new design.

On the test app, workouts are numbered independently of weekdays. **Up next** follows your completed workouts across program weeks, then loops back to Workout 1. For a Monday/Wednesday/Friday schedule started on Wednesday, you can do Workout 1 Wednesday, Workout 2 Friday, and Workout 3 Monday. Missing Friday leaves Workout 2 ready for your next visit. The selected weekdays appear separately as your planned schedule; you can train on another day.

Only completing the recommended workout advances that order. You can still preview or do another workout, but an extra/repeated workout does not skip the one that was next. A partial workout remains resumable and does not advance the order. Weekly progress remains separate, counting distinct completed workouts in each seven-day program week. A partial finished in a later week counts in the week it is completed. Starting a new program or explicitly restarting week 1 begins at Workout 1; history and working weights remain.

1. Tap a workout on Today. The preview shows exercises, estimated time, warm-up, and cool-down. Browsing this screen does not start a workout. Use **Reorder**, **Swap**, or an exercise's **How to do it** when needed.
2. Choose **Start workout**. Follow the timed warm-up, then the exercise flow. A list view and workout-list menu let you navigate between session parts.
3. Enter actual weights and reps (or seconds), then mark a set done. Weight defaults are suggestions. Per-side and added-weight labels matter; follow the displayed instructions.
4. Rest timers can start after sets; recovery timers can appear between exercises. **Too easy** / **Too heavy** feedback and completed sets influence future targets. Skipped/unchecked sets do not count as completed work for progression.
5. Use the pause/end control to **Take a break**, **End workout**, or **Discard**. Pausing preserves the draft and adds Resume on Today. Reloading can reopen the draft automatically. End saves completed work. An unfinished session is labeled **Partial**, shows completed/planned sets, and stays available through **Resume remaining sets** on Today, including after a reload. Finishing the remaining sets updates the same history entry. Discard throws away unsaved work after confirmation; an already-saved partial history entry remains.
6. Complete the cool-down and choose **Finish workout**. At least one checked set with a positive rep/seconds value is required. The summary explains next targets and history receives the session. Only a session with all planned working sets finished counts toward weekly completion; repeating the same workout does not inflate that count. Warm-up/cardio/cool-down are not counted as working sets. Older logs without completion metadata retain their existing completed status. Signed-in users can send a separate coach message from the summary.

On dev, the exercise, rest, lighter-set, and guided warm-up/cool-down timer screens share one layout: a labelled progress bar at the top (for example **Exercise 1 of 5**), one card, and one main button. On an exercise the card holds the set number, the goal, the weight and reps controls, and a tile for each set; tap a finished set's tile to reopen it. Timers have the same two side buttons on every screen: 15 seconds either way during rest or a long cardio block, otherwise **Back** and **Skip** between moves. The **⋯** button beside the main button opens **More**: Swap, Adjust, Add a set, Remove a set, Skip, sound on/off, and, on guided timers, Show as a list and Skip the rest. The save status is shown in **More** and in the workout list (☰); it takes a line on the workout screen only when something needs attention. This layout is awaiting approval for the live app.

Changing the set count with **Adjust** or **Add a set / Remove a set** (in **More**; **+ Set / − Set** on the live app) updates the current workout’s completion requirement. Completed sets are preserved when reducing the target. Skipping an exercise still leaves its unfinished sets available to resume. Resetting an adjustment restores the default set requirement.

On dev, the shared one-card design also covers workout preview, exercise completion and the next station, warm-up/cool-down checklists, cardio choices, the end of cool-down, the workout list, and saved-workout summaries. Long previews scroll to the Start/Resume button without a sticky button covering exercises. The saved summary still opens as a dialog; it shows completed/planned sets, time, next targets and save information. A partial workout keeps its Resume option. Member accounts retain the optional coach-message action.

Before a new superset, **Two moves, then rest** names exercise A and exercise B and explains the sequence. Tap **Start A** to continue. Each exercise shows both moves with the current one highlighted and a **Round** count. The Done button says **go to B**, **start rest**, or **finish pair**, according to the next actual step. During rest, the screen names the move and round that come next. Extra sets on one move continue with rest between them. Acknowledged introductions stay dismissed after reload; an older workout with logged sets continues without interruption. Swaps, skips, set edits and progression retain their existing behavior.

The cardio effort check-in now lets you select **Too easy**, **Just right**, or **Too hard**, then tap **Continue**. Choosing an answer alone does not apply the feedback; an unfinished selection is kept with the workout draft. These updates are on the test app only.

Persistent swaps change the plan from then on. A **today only** substitution or a change caused by another training place is different. Read the sheet before confirming. **Adjust** changes the slot's sets, range, rest, recovery, or working weight. **Reset adjustments** restores the app's default set/rep/rest/recovery targets for that exercise; it does not restore an earlier coach version or change the working weight.

## Progress and programs

Programs last six weeks, measured from the program start date. Targets depend on experience, goals, completed work, and difficulty feedback. Beginner/returning users have easier introductory weeks; older beginners can have a longer easing period. The app offers later check-ins and suggestions to adjust workload.

At the end of a program, Today offers **Start the next program**. Settings also lets the person start early, restart week 1, or return to a stored previous program when available. Starting a new program carries exercise progression forward; the variety setting governs which exercises change. It is a user action, not an automatic calendar reset.

Weekly weigh-ins are optional and can show a trend while hiding the number. A saved weigh-in also updates the body-weight setting used by starting-weight suggestions.

## Saving, changing devices, and backups

The app saves a browser copy and, when signed in/connected, syncs to Supabase. The tappable indicator appears in the app header and during workouts: **Saved on device**, **Sync pending**, **Syncing…**, **Synced**, **Sync failed**, or **Device save failed**. Tap for an explanation and **Retry sync** when signed in. A device save is separate from account sync; a storage failure requires keeping the page open and copying a backup. Coach messages, invites, and other network actions are not a durable offline outbox.

On dev, sign in to the same account on another device to retrieve its data. Independent workout entries are combined. If both devices change the plan/settings/active workout, or edit the same history entry differently, saving pauses with **Review sync conflict**. Tap the save indicator, copy both versions if needed, then choose **Keep this device’s version** or **Use account version**. The choice applies to conflicting data; independent workouts are retained and deleted workouts stay deleted. Plan/settings/progression are chosen together, not merged field by field. You can decide later and keep working locally, but cannot sign out until the conflict is resolved.

The latest resolved conflict remains available through the save indicator’s **Copy last conflict recovery** until another conflict is resolved, you switch accounts, or sign out. Keep a private copy before those actions if needed. The first sync after upgrading may ask you to choose between differing older device/account copies because no shared baseline was recorded previously.

Use **Settings > Account & backups > Backup > Copy backup** (on the test app) to keep a personal copy. **Restore my backup** replaces state/logs after confirmation. The signed-in warning explains that the replacement syncs to the account and other devices and may remove account workouts missing from the backup. Back up first and use only the intended person's data. On dev, an explicit restore gives imported workouts new internal IDs, so intentionally restored sessions can be saved even if their original copies were deleted. An ordinary reconnect does not restore deleted history. Do not paste a real backup into a public issue or repository.

Changing lb/kg converts working weights, previous sets, historical set/planned weights, body weight, weigh-ins, and active/saved drafts. Display values are rounded to two decimals; stored conversion values retain more precision. Version 6 records units explicitly. Legacy values are assumed to use their saved profile unit: incorrect unit switches made before this fix cannot be reconstructed automatically. Historical free-text progression notes retain their original explicitly written units.

Sign-out flushes queued and in-flight changes before clearing the local cache. If syncing fails, sign-out stops and the device copy is retained; retry sync and keep a backup if problems remain. Signing out clears the cached plan/history from that browser. It does not delete the account.

On dev, **Settings > Account & backups > Account > Delete my account** permanently removes the login, plan/settings, workouts, and coach messages. Copy a backup first if wanted, then type **DELETE** and confirm. Cancel is focused initially. A sign-in within the last ten minutes is required; if asked, cancel, sign out, sign in again, and return to the deletion screen. Paused and not-yet-invited accounts can also delete from their account screen. Coach and owner accounts must arrange deletion with the app owner. Joining again requires a new beta invite.

App feedback remains to help improve the app, with its profile link and workout reference removed. Its text and screen/device context remain and may identify the sender; contact the app owner to request removal of retained feedback. Successful deletion clears this browser's account copy. Other devices can retain offline copies until they reconnect; a connected current dev client removes its copy when account sync confirms the account is gone. Backups copied elsewhere are not erased.

## Feedback and coach tools

On dev, signed-in users can choose **About the app** (owner inbox) or **To my coach** (their assigned coach's conversation) in Feedback. Coaching threads are visible only to the member and the coach who invited them; other coaches and app owners without that assignment cannot read them. Accounts without an inviting coach show that no coach is linked; the app does not choose one automatically. App feedback retains its separate owner-only inbox and includes screen/device context.

The compact **Your coach** card in Settings is the everyday entry to messages. Today shows a coach card only while there are unread incoming messages, including new plan-update notes. Opening the conversation clears its unread badge; **×** also marks the currently shown messages read without deleting them. Older notes are kept in the conversation. Existing imported plan notes start as read. The former always-on Today plan-note card is replaced for signed-in users.

Coach accounts do not show the member-facing **Your coach** cards, **To my coach** feedback option, or post-workout **Tell your coach** action. Their Feedback sheet goes directly to **About the app**. They still read and reply to their clients through **Your people > Messages**. This follows coach membership, including accounts that also hold the app-owner role; app-owner membership alone does not hide member features.

The conversation opens over the current screen. **Done**, **Back**, or **Back to workout** returns to it without changing workout sets or pausing a running timer. Bottom navigation is hidden while messaging. The input starts on one line and grows as you type; tags are optional behind **Add tag**. A member message can include the workout reference displayed below the input. Draft message text survives closing and reopening a thread during the same signed-in page session; it is not an offline outbox and does not survive reload/sign-out/account switching. A failed send retains the text for retry, and unchanged retries use the same message ID to prevent duplicates.

The dev keyboard-layout correction keeps the reply area above the on-screen keyboard and removes extra Home indicator padding while typing. The underlying page is locked until the thread closes, then returns to its previous scroll position. This addresses the reported iOS Home Screen gap; confirmation on a physical iPhone remains pending.

Coaches use **Your people > Messages**, with **Needs reply** and **All** filters. Reading clears **new** but does not clear **Needs reply**. A reply or **Mark done without replying** resolves received messages through the version opened by the coach; a newer incoming message still needs attention. Sending a message does not edit the plan. Plan-update notes appear when sent; plan application still waits for an active or paused workout to end.

On dev, messages, unread badges and reply status update automatically while the app is open and connected. The latest outgoing message shows **Sent** after it is saved, then **Read** after the recipient opens the conversation or marks it read. As requested, dismissing the Today card with **×** also marks those messages read and updates the sender's receipt. No Delivered status is shown. Reading stays separate from the coach's Needs reply status.

Live arrivals preserve the draft, focus and cursor. If you are at the bottom, the conversation follows new messages; if you are reading older messages, it stays in place and offers **New messages ↓**. New arrivals fetched while you are reading older history are not marked read until you return to the bottom. **Reconnecting…** or **Offline** indicates a connection interruption; the app catches up when connected again, with a 15-second foreground check as a fallback. **Refresh** remains available. Backgrounded pages stop the live subscription; these updates do not create phone notifications.

On dev, the old copy-and-text progress report flow has been removed from History, program completion, and workout instructions. Once a signed-in person's workouts have synced, their coach can review them through **Your people**; no separate report is needed. Personal backups remain under Settings. This cleanup is awaiting approval for the live app.

For a coach, **Settings > Your people > Open** shows approved people's activity, pending updates, messages, and invites.

- **Invite someone** creates a one-use link. Copy/share it deliberately with its intended recipient. A waiting invite can be cancelled.
- **Open their app** loads a person's plan/history into a temporary coach view. The banner identifies whose app is being viewed. Edits are not saved automatically.
- Change exercise choices, set/rep/rest/recovery targets, or level, then **Send changes** with an optional note. Profile, schedule, equipment, and working weights are view-only. Coach view does not offer workout recording, history deletion, backup restore, or program restarts. **Preview at** changes the displayed location only; it is not sent to the member.
- The recipient applies pending updates after opening/syncing when a plan exists and no draft is active. A paused draft also postpones application. On dev, the changed plan and its acknowledgement are saved together; an interrupted save is retried without consuming an unsaved update. **Back to my app** restores the coach's view and discards unsent preview edits.
- App feedback supports marking entries done and marks loaded entries read. Coaching unread status clears when an individual thread is opened, while reply status stays separate.

App owners can manage eligible non-staff accounts from Your people. **Disable** preserves data and pauses access; **Turn back on** reverses it. **Delete** permanently removes the account and related workout/plan data after typing the person's name/email. Staff/self-deletion are guarded. App feedback remains with its profile reference removed and workout reference cleared; its free text can still identify someone. Do not use deletion as a test.

See [architecture](ARCHITECTURE.md) for permission boundaries and [the review](REVIEW-2026-11-11.md) for outstanding reliability/validation work.

## Dialog accessibility

Dialogs have accessible names, place focus inside on opening, keep Tab/Shift+Tab within the dialog, and close with Escape. Closing restores focus to the opening control (or a nearby page heading if it no longer exists). The underlying page is temporarily inert. Confirmation dialogs initially focus Cancel. Touch zoom restrictions and safe-area layout are preserved.
