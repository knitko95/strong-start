# Remaining workout screens — November 11, 2026

## Authorization and scope

The owner requested that all remaining workout screens match the new design, including the superset explanation, and explicitly limited publication to the test app. Implemented from current dev `adfd49e`; this supersedes the earlier pending-approval note for #4 and the design gaps documented in [the spacing review](WORKOUT-LAYOUT-2026-11-11.md). No production release is authorized.

## Result

| View | Update |
| --- | --- |
| Preview | One session card containing warm-up, exercises and cool-down; preserves how-to, swaps, reorder, places and optional cardio. Start/Resume follows the content without covering rows. Browsing does not start a workout. |
| Exercise complete / next station | One card combines completed sets, weight feedback, next targets, recovery time and the next exercise. |
| Warm-up/cool-down checklists | One card contains the existing checkboxes and move options. More retains guided timers, sound and warm-up skip. |
| Workout list | Matching card and bottom return action inside the existing accessible dialog; jumping, pause/end and save details remain available. |
| Cardio choice | One card holds duration, explanation, swap and skip; bottom action starts optional cardio. |
| Cardio effort | Selection plus bottom Continue; feedback applies once on Continue, and pending selection survives reload. |
| End of cool-down | One card shows completed/planned sets and elapsed time before saving, with access back to cool-down. |
| Saved summary | Matching card and bottom return action in the existing dialog. Preserves next targets, partial completion/resume, save information and the optional member coach-message action. |
| Supersets | Introduction names both moves and explains A → B → rest; exercise/rest screens show the pair, current/next move, round and an action describing the actual destination. |

The superset explanation is acknowledged per pair within the workout draft. Existing drafts with logged sets are not interrupted. The scheduler, locked pair membership, per-side targets, logged sets, skipped-set resume, load progression and timer durations are preserved. Unequal counts continue to the remaining move with the existing rest behavior. The guide's existing automatic ready countdown is unchanged; the separate cool-down Ready request (#5) and timer-drag request (#7) are outside this update.

No new database migration, Auth/access change, storage reset or production configuration is needed. Additive `draft.pairSeen` and `draft.guide.feelChoice` data use the existing persistence/sync path.

## Verification

- `node scripts/build-dev.mjs`: syntax/environment checks, 49 persistence/workout scenarios and five offline-worker scenarios passed.
- New behavior checks cover acknowledgement without logging, reload, existing drafts, skipped partners, unequal sets, automatic/manual rest, and cardio feedback applied only on Continue.
- `node scripts/test-workout-layout.cjs`: 228 layouts across 19 states, three viewport sizes (390 × 844, 320 × 568, 844 × 390), light/dark and simulated phone insets. Checks one main card, horizontal fit, safe footer clearance and scrolling when genuinely needed.
- Browser actions cover introduction → A → B → rest → next round, reload, Adjust preserving both moves and logged rows, workout-list jumps, cardio selection/Continue, checklist-to-guide, complete/partial summaries and return to Today. Both summaries preserve the underlying log/draft status.
- Phone-size screenshots reviewed for preview, exercise completion, checklists, cardio effort, end of cool-down, pair introduction, active pair, pair rest and both summaries.
- `node scripts/test-coach-messaging.cjs` passed at 1280, 390 and 320px using its synthetic backend, covering message navigation, workout preservation, member/coach boundaries and keyboard geometry. This also checks the coach-account summary does not gain a member-only coach prompt.
- Synthetic local state only; no account creation or member data. The same browser script accepts the hosted test URL and first requires exact development-build HTML and the development backend reference.

Physical iPhone/Android Home Screen, native safe areas, keyboard and background audio behavior remain unverified. Long content still scrolls, especially on short screens. These checks do not claim new database or real-account messaging validation.
