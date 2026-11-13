# Cardio timer controls — November 12, 2026

The owner reported reversed +15 / −15 behavior during warm-up and asked to check cool-down too. Both used the same elapsed-position seek helper: plus sought forward and reduced remaining time; minus sought backward and increased remaining time.

The controls now adjust the current part's countdown, matching rest timers. Plus adds 15 seconds even at the beginning of a part, without rewinding into an earlier part. Minus removes 15 seconds; reaching zero completes the current part once. Automatic cardio transitions, final effort feedback and the next manual move retain their existing flow. Paused adjustments retain pause, including when minus advances into the next cardio part. Existing timer fields store these changes across pause/reload; planned durations, exercise data and working sets are unchanged.

## Verification

- Development syntax/environment/exercise-guide build checks pass.
- 100 workout/persistence scenarios pass. New coverage checks both phases, exact plus/minus direction, adding at the start, pause/reload, zero-time transitions and final effort feedback.
- Warm-up and cool-down browser suites click the actual accessible 15 seconds more/less buttons while running and paused, asserting exact changes to deadlines or paused remaining time and retaining the current part.
- The suites cover six warm-up journeys / 42 layouts and six cool-down journeys / 54 layouts at desktop and 390/320-px phone widths in light/dark.

Runtime commit `461ee6d891c00da8cb6aceec9825aa048b780bb7` deployed successfully to dev through Workers Build `0e69e32b-6de9-4827-b423-fb81b5d8e08b`. Hosted entry checks confirm exact corrected HTML and the development backend at 1280/390/320 px. All six warm-up / 42-layout and six cool-down / 54-layout hosted journeys pass, including actual plus/minus clicks while running and paused, with no console or page errors. Physical phones and real authenticated accounts remain unverified. No database, configuration or schema change is needed; production publication is not approved.
