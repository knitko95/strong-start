# History exercise progress — November 12, 2026

Owner approved implementing the reviewed local History mockup on the test app, including real history-based scores. This authorizes development publication only.

## Behavior

History opens on Sessions, retaining session tiles, original recorded order, partial labels, plan notes, deletion confirmation and coach read-only behavior. Exercises has name search and All / Upper body / Lower body filters. Expanding an exercise shows its recorded workouts newest first, using the same numbered tiles. Archived exercise names remain searchable. Core/mixed and unknown exercises remain in All.

Your exercise progress offers Overall / Upper body / Lower body, defaulting to Overall. Exercises behind this score links directly to the existing Exercises list: clear conflicting search/filter, expand the selected exercise, focus and scroll its header into view. No separate exercise-detail screen exists.

## Calculation and limitations

- Read-only derivation from current account `logs`; no cached scores, state/schema changes, network queries or database mutations. Coach preview uses its currently loaded person's logs. Deleted history disappears from the next calculation.
- Sort valid session dates chronologically, tie-break by session ID, and combine repeated entries for the same exercise within a session. Each session contributes at most one best-set result per exercise. Extra identical sets never raise the score.
- Loaded, rep-based exercises: best estimated one-rep max using the existing `weight × (1 + reps / 30)` formula, accepting positive finite loads and 1–30 reps. Convert each log's explicit units to kg for calculation. No actual maximum attempt is required or suggested. This estimate is a tracking proxy, not a tested strength measurement.
- Unloaded bodyweight and reps-only exercises use best positive reps. Unloaded timed exercises use best positive seconds. Only the same measurement type is compared for each exercise. All historical results still appear as recorded sets, even where scoring is unavailable.
- Assisted machines, power movements, added-weight bodyweight sessions, loaded timed holds, missing/zero/negative load, invalid values, invalid dates, and partial sessions do not contribute. Bodyweight must not be reconstructed from the person's current weight. Reps above 30 are excluded from loaded estimates. Unsupported exercises may have no individual trend; their recorded sets remain available.
- Each exercise needs four comparable completed sessions. Its baseline is the median of its first two results; its current result is the median of its latest three. An exercise's index is `100 × current / baseline`. A session with no comparable result is ignored, rather than converted to zero. Four sessions are needed to show a score; the two-session baseline and three-session window overlap initially.
- Each eligible exercise has equal weight; Overall averages exercise indices directly, including core/mixed work. It does not average the Upper and Lower indices. Upper/Lower classification uses existing primary muscle metadata: exclusively lower-region primary muscles go to Lower, exclusively upper-region go to Upper, and core/mixed/unknown remain only in Overall/All.
- The graph uses the same **currently eligible** exercise cohort for every point. It starts when all cohort members' two-session baselines exist. Each plotted date uses that exercise's latest up-to-three results known at that date, carrying its last value forward between sessions. With only two results, the median equals its baseline. Baselines can occur on different dates, so the displayed line need not begin at exactly 100. Different areas can cover different dates. Adding an eligible exercise or deleting history can recalculate past graph values; the UI explains that the contributors and graph can change.
- A result below 100 describes lower recorded performance relative to the baseline; it is not a warning or a claim of lost fitness. Intentional easier sessions can still move the median. Equal weighting does not establish a clinical, scientific, whole-body strength or health score. Reps/hold time are not interchangeable physiological measurements; only their own relative changes are combined.
- Individual exercise trends use the same comparable completed-session metrics, without the four-session threshold or smoothing. Partial and unsupported results remain visible in the tiles, not silently added to those trends.

## Checks

Local development build: 100 existing workout/persistence scenarios, media lifecycle checks and six offline scenarios. Existing History browser journeys and new score/navigation journeys cover desktop, 390 px and 320 px, light/dark. Numerical fixtures verify Overall 122.5, Upper 110, Lower 120, baseline/eligibility, exclusion of partial/assisted/invalid work, core inclusion, history deletion, and lb/kg invariance. UI checks include typed search, combined filters, empty results, keyboard breakdown navigation, clearing hidden targets, set tiles, trends, coach browsing without delete controls, deletion cancellation, escaped archived names and no mutation of state/logs/storage by browsing.

Publication and hosted verification will be recorded after the exact candidate deploys. No production deployment or database/configuration change is authorized. Physical phones and authenticated real-account flows remain unverified.
