# Active workout review: 2026-11-23

Scope: one full guided workout on the development build (0.28.1-dev), run headless at 390 px and 320 px with synthetic data. It covered warm-up cardio, the cardio check-in, warm-up moves, the warm-up set, working sets, rests, editing a finished set, reloading mid-workout, the workout menu, the exercise-complete screen, the cool-down walk, foam rolling, stretches and the finish screen. I ran it a second time at a place with a foam roller and a massage ball.

Not checked: a real phone with the screen locked or the app in the background (timer accuracy, beeps, vibration, keeping the screen awake), real network delays for demonstrations, and a superset workout from start to finish.

Owner direction (Nov 23): retention depends on this experience. Go through each item one at a time, mock any UI change first, and add nothing until the owner approves it.

## Fixed on dev (0.28.1-dev, commit e90deab)

1. **Warm-up set could not be tapped.** It showed as a plain label in the set line. It is now a button that opens the warm-up set to check or change its weight, and **Save changes** returns to where you were, including a running rest. Tapping a working set while the warm-up set is current moves on to that set.
2. **Set numbers changed between screens.** On set screens the warm-up counted as Set 1 (working sets were 2–4), but on rest screens it disappeared and the working sets were renumbered 1–3. Both screens now show the same line.

## Open items, in suggested order

| # | Area | What happens now | Suggestion to discuss |
|---|------|------------------|-----------------------|
| 3 | Foam rolling | One item ("Foam roll: upper back and lats") with a 30-second timer per spot. The current spot appears only at the end of the grey description line. No demonstration. Timer only. | Make each spot its own move with a specific name (for example, "Foam roll · upper back"). Link each to its Library entry and give it a demonstration through the pose-review workflow. Default to a timer, with an option to count passes instead (for example, 8 slow passes), and remember the person's choice. Owner wants this; mock first. |
| 4 | Toasts | Messages such as "Warm-up done. Nice!" and "Rest is up. Next set." sit over the exercise title. | Move them so they don't cover the title, or make them shorter and quieter. |
| 5 | Rest screen | Shows the timer, the set line and **Ready**, with nothing about the next set. | Add "Next: Set 3 · 15 lb × 8" so people can set up during the rest. |
| 6 | Exercise-complete screen | The main button sits at the bottom of the screen, well below the card. The "Move to the next station" timer shows a stretch tip (for example, a doorway pec stretch), which can read like an extra task. | Bring the button up under the card, and decide whether the stretch tip belongs there. |
| 7 | Cardio check-in | **Continue** sits far below the answers and is greyed out until one is picked. | Continue straight away when an answer is tapped, or move the button up to the answers. |
| 8 | Taps in guided warm-up and cool-down | Each timed move needs **Ready**, then **Done**. Stretches done per side also wait after "Switch sides". Four stretches can take about 16 taps. | Run timers straight through by default (Ready once per move, switch sides on its own), with a pause button. |
| 9 | Demonstration loading | The first exercise shows "Loading demonstration…" over a large blank area. | Show the still image or a placeholder of the same size while it loads. |
| 10 | Cool-down walk | No −/+ time before starting (the warm-up cardio has them once running). | Same controls as warm-up cardio. |

## Next checks

- Owner phone test of locked-screen timers, beeps and screen wake.
- A superset workout and a timed (seconds) exercise from start to finish.
- Pausing and resuming from Today, and **End workout** (save or discard).
