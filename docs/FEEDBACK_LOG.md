# Strong Start: feedback log

The shared list of what the owner has asked for, what was decided, and where each item stands. Every assistant working on this app (Claude, ChatGPT or any other) reads this at the start of a session and updates it after each decision or release. Started November 11, 2026, from the owner's earlier private log.

## How to use this log

- **Nothing is added to the app until the owner says so.** Items are discussed one at a time. "To discuss" means not approved to build.
- Record a decision only when the owner actually made it. Do not invent approvals or fill gaps from guesses. If you are unsure whether something was approved, write "owner to confirm".
- When you build something, add or update its row in the same push. Give work that has no item yet a new number.
- Mark an item **Live** only after it is verified on the live site. Work that is only on `dev` is **On the test app**.
- Follow [AGENTS.md](../AGENTS.md) for how changes are built, tested and released.
- **This repository is public.** No names, email addresses, invite codes, messages, business or pricing plans, or links to private chats here. The owner keeps a private log for those; write "see owner's private notes" if needed.

**Statuses, in order:** To discuss → Agreed → Mocked up → Built, not published → On the test app → Live. Also: Not doing (with the reason), Later (needs a bigger decision).

**Mockups:** when the owner asks to see something first, render it from the real app code (a throwaway copy, screenshots at phone size) so it matches exactly, and wait for her OK before building.

## On the test app, not live yet

On `dev` only as of November 11, 2026 (through commit `c85b17c`). The owner confirmed on November 11 that she approved building these. Going live still needs her approval of the tested release.

| Commit | What it changes |
|---|---|
| `006cfdd` | Test setup: the app uses the real database only at the live address; anywhere else it uses the test database, shows a Testing banner and keeps its phone data separate. |
| `0fe6dc0` | Removes the old copy-and-text progress report for coaches. |
| `e6260ed` | Switching lb/kg converts saved weights and history (saved-data version 6); half-finished workouts can be resumed; sign-out waits for saving to finish; save status fixes. |
| `ffb3e98` | Clearer member instructions and privacy page; coach view limited to plan edits. Removes the unused old workout screen and first-workout tour. |
| `b7c51fe` | Phone layout: screen stays fitted and the bottom menu clears the screen edges. |
| `c029b09` | Workout completion counts, separate week-order and exercise-order resets, one set of rules for body-weight entry. |
| `aa2e898` | Safer saving across devices and coach plan updates applied in one step. Needs database migration `20261111184231_atomic_account_sync` (on the test database only). |
| `7bf59e0` | Keeps coach activity times correct during account sync. |
| `c85b17c` | Reopening the app with no signal, more accessible pop-ups, shorter setup. |
| `9dab2b1` | Timer beeps (#6): any tap now gets the sound ready, and sound the phone paused (reload, screen lock, call, headphone change) is woken before a beep. Requested November 11. |

## Built earlier, never published (needs recovering)

These were built on November 9–10 in a copy of the app that was never pushed. The code exists only in one of the owner's earlier Claude chats. Claude can recover it; merge only those changes into current `dev` and retest, because the workout code has changed since.

| # | Item | Status | Decision / notes |
|---|---|---|---|
| W1 | Library tabs for Warm-ups (73) and Stretches (45), with where to do it and steps; a video slot for each | Built, not published | Videos plug in by name once filmed. |
| W2 | Swap for warm-up moves (up to 5 similar moves) and cool-down stretches (21 new alternatives) | Built, not published | Skips moves that strain flagged areas and kneeling stretches for bad knees. |
| 1 | Warm-up sets: one set of 10 at about half the working weight | Built, not published | Agreed from a mockup: rounded to a loadable weight. Heavy strength days (first lift 6 reps or fewer) add a second set of 4 at about three-quarters. Skip stays. |

## Owner's items

| # | Item | Status | Decision / notes |
|---|---|---|---|
| 2 | Assisted pull-up machine: offer it as a swap for pull-up movements and as the go-to for beginners | To discuss | Already in the library and picked for Just starting. It is logged as reps only (no assistance weight), and there is no plain Pull-Up exercise. |
| 3 | Review full body, legs and upper splits so every muscle gets hit as well as the time allows | To discuss | |
| 4 | Supersets weren't obvious (last two moves), and the Bayesian Cable Curl couldn't be tracked correctly | To discuss | Likely tied to the 30–45 minute pairing. Check the logging bug. |
| 5 | Cool-down: after the walk, tap Ready before stretch timers start, and list everything needed (bands, foam roller, mat) | To discuss | Mockup required before building. |
| 6 | No beeps during a workout (app open, volume up, headphones in, sound on in the app) | On the test app | Bug. Fix in commit `9dab2b1` (Nov 11), checked in a desktop browser with simulated phone pauses only. Owner to confirm on a real phone. Not covered: iPhones mute web-app sounds while the ring/silent switch is on silent, and timers cannot beep while the app is in the background (see Later). |
| 7 | Stretch timer: no restart. Drag the timer circle to add or remove time | To discuss | |
| 8 | Setup accepted a one-letter name and age 6. Require a full name and a minimum age (probably 18) | To discuss | Age limit to be decided. |
| 9 | A two-day week on back-to-back days was too hard. Warn when similar muscles repeat without enough rest; offer "Leave it" or "Spread it out". Minimum 24 hours, preferred 48 | To discuss | Better to hit a muscle once a week than twice without rest. |
| 10 | End of program: short congratulations pop-up, what's next, and questions that shape the next program (including exercise variety) | To discuss | Mockup required before building. |
| 11 | Coach view for tracking clients | Live (first version, Nov 10) | Settings › Your people: progress at a glance, open their app, send plan updates. More coach features still to discuss. |
| 12 | Owner films how-to videos; a voice-over is added. Needs a filming list (most-used exercises first), a clean way to attach videos to the library and how-tos, and a short voice-over script | To discuss | The exercise library would move into the database as part of this so the owner can edit exercises and attach video links. Videos go on a video host, not Supabase. |
| 13 | In-app feedback, with app feedback kept separate from coach feedback | Live (Nov 10) | Feedback button on every screen; About the app and To my coach; two inboxes in Your people with new counts. App feedback goes to the app owner only. Signed-in people only. Commit `1cb950a`. |
| 14 | Coach notes history | Folded into #19 | |
| 15 | Progress charts in the coach view (main lifts over time, workouts per week) | To discuss | No database change needed. |
| 16 | Invite-only beta | Live (Nov 10) | One-time invite links from Your people, 14-day expiry, enforced in the database. "Use without an account" hidden during beta. Commit `77c51ed`. |
| 17 | App owner can disable or delete accounts | Live (Nov 10) | Owner only; coach and owner accounts are protected. Delete keeps app feedback without the name. Commit `5580f41`. |
| 18 | Remove the old Coach section from Settings | Live (Nov 10) | Commit `a54d26b`. |
| 19 | "Your coach" card and a message thread between a person and their coach, with coach replies in the app | Mocked up | Decided: a message thread, not just contact info; no phone notifications (a "new" badge instead); each person's coach is whoever invited them. Five mockup screens shown. Waiting on the owner's OK or changes. Do not build yet. |
| 20 | Prompt beta testers to add the app to their Home Screen | Live (Nov 11) | Screen after account creation with iPhone steps and an Android Install button; reminder card on Today (× hides it for a week); one-time "Sign in one last time" screen in the Home Screen app. Commit `149f807`. Owner to confirm: a Settings row to reopen the steps, a Home Screen / Browser tag in Your people, and Google sign-in inside the iPhone Home Screen app on a real phone. |

## Standing decisions

- **Database:** accounts, plans, workouts and feedback live in the database; later the exercise library (with #12). Rep ranges and progression rules stay in code, where changes are tested before release. Videos go on a video host with links in the database.
- **Two roles:** app owner (receives app feedback; `app_owners`) and coach (receives coaching messages; `coaches`). The owner currently holds both.
- **Beta access:** invite-only, one-time links, 14-day expiry.
- **Release (Nov 11):** build and test on `dev`, the owner approves each tested release before it goes live.

## Later (needs a bigger decision)

Rest timer alerts while in other apps, exercise photos and videos, a quick-workout option, a custom domain, a real email sender for password resets, a fold-down rig step as equipment.

## Done

- Nov 11: test app and separate test database; shared agent rules and app documents; Home Screen prompt (#20).
- Nov 10: own hosting, accounts with Google sign-in, coach view, privacy page, in-app feedback (#13), invite-only beta (#16), disable/delete accounts (#17), old Coach section removed (#18).
- Nov 9: first-tester notes addressed (change one setup answer, reorder exercises, plain warm-up how-tos, Skip exercise, Edit a set, exercise variety, library filters, swap from library, warm-ups matched to the workout); real workout length, compact cardio timer, go back to previous program, jumps setting, goal-based cardio after lifting.
