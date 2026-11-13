# Exercise audit source register

This is the ongoing reference index for exercise audits. The owner requested keeping NASM associations and references to other credible sources for auditing, outside the app. This register and the dated audit records live in the public repository; they are not imported by the app or included in the current Cloudflare runtime asset packages. They are not private documents.

The initial associations below come from the [November 11 audit](EXERCISE-AUDIT-2026-11-11.md) and its [structured evidence inventory](exercise-audit-2026-11-11.json). They preserve the original review date, findings and limits. Creating this index does not constitute a new source review or establish professional approval.

## How to maintain this register

- Keep each catalog exercise linked by its existing app ID, even when its display name changes. Warm-up/stretch names are separate entries because those guides do not have persistent catalog IDs.
- Preserve existing NASM references when adding another publisher. Multiple independent references can be associated with one exercise. Record the publisher, page title, exact URL, review date, relationship to the movement, facts checked, limitations/disagreements and resulting app correction (or no change) in a dated evidence record.
- Assess the actual page's authorship, evidence and relevance before treating it as credible. A familiar publisher name or successful URL response alone is insufficient. Inspect the specific exercise; do not use a general article as proof of every variation.
- Use **Same movement**, **Related only**, or **No suitable reference** for coverage. These describe the relationship, not a safety rating or a completed clinical review. Record unresolved questions and source errors rather than silently treating an entry as verified.
- Add each later audit to the history below and link its evidence from the affected rows. If a source changes, disappears or redirects, retain the old URL/date and record its current status plus any replacement. Preserve earlier findings rather than overwriting the historical audit.
- Keep only source metadata, links and independently written audit notes. Do not copy instructional text, screenshots or media into this register. References do not imply permission to reproduce material or publisher endorsement.
- Keep references and review notes in `docs/`. Do not add them to exercise cards, account data, runtime assets or the app's database without a separate request.

## Audit history

| Review date | Publisher(s) | Scope and evidence |
| --- | --- | --- |
| 2026-11-11 | NASM | [Findings and verification limits](EXERCISE-AUDIT-2026-11-11.md); [all 320 catalog entries, 92 warm-up guides and source mappings](exercise-audit-2026-11-11.json). |
| 2026-11-11 | NASM, ACE, Runna | [Six standalone animation drafts: movement comparisons and unresolved differences](EXERCISE-ANIMATION-BATCH2-2026-11-11.md). No catalogue wording changes or technique approval. |
| 2026-11-13 | NASM, ACE, PureGym, TRX, Catalyst Athletics, Physitrack and other identified authors | [Detailed internal technique research](EXERCISE-TECHNIQUE-2026-11-13.md): original notes for all 320 catalog exercises, all 92 named guides and 12 cardio types / 67 app labels. [Library, evidence relationships and review limits](exercise-technique/README.md); [257 source URLs and section-specific limitations](exercise-technique/sources.md). Research drafts; no runtime cue changes or professional technique approval. |
| 2026-11-13 (follow-up) | Tony Gentilcore; TRX; Millett / Reinold; Suspension Exercise retailer; Ben Bruno / Testosterone Nation | [TRX anti-rotation setup resolution and source conflicts](TRX-ANTI-ROTATION-2026-11-13.md). Direct written movement guidance plus manufacturer handle procedures resolve the initial configuration gap; five references added, 262 URLs total. Selected foot arrangement and excluded overhead progression are explicit. No video motion or professional technique approval claimed; no app changes. |

## Catalog exercise associations

The coverage and date columns below preserve the underlying November 11 audit. Later internal technique links have their own November 13 relationships and evidence boundaries; they do not overwrite those historical columns. The date shown is the underlying audit date. The initial coverage is 33 same-movement comparisons, 244 related references and 43 entries without a suitable reference. Use the dated evidence inventory for each entry's findings and changed fields. Source keys below link directly to the original page; titles are listed in the source directory.

| Exercise | App ID | Reference coverage | Reviewed | Sources |
| --- | --- | --- | --- | --- |
| Barbell Bench Press | `barbell-bench-press` | Same movement | 2026-11-11 | [NASM:bench][nasm-bench]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#barbell-bench-press) |
| Dumbbell Bench Press | `dumbbell-bench-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-bench-press) |
| Close-Grip Bench Press | `close-grip-bench-press` | Same movement | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#close-grip-bench-press) |
| Smith Machine Bench Press | `smith-machine-bench-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#smith-machine-bench-press) |
| Machine Chest Press | `machine-chest-press` | Same movement | 2026-11-11 | [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#machine-chest-press) |
| Standing Cable Chest Press | `standing-cable-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#standing-cable-chest-press) |
| Single-Arm Cable Chest Press | `single-arm-cable-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#single-arm-cable-chest-press) |
| Single-Arm Dumbbell Bench Press | `single-arm-dumbbell-bench-press` | Same movement | 2026-11-11 | [NASM:single-db-press][nasm-single-db-press]; [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-presses.md#single-arm-dumbbell-bench-press) |
| Dumbbell Floor Press | `dumbbell-floor-press` | Same movement | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [Runna: floor press](https://support.runna.com/en/articles/6413209-floor-dumbbell-bench-press-exercise-tutorial); [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-floor-press) |
| Kettlebell Floor Press | `kettlebell-floor-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#kettlebell-floor-press) |
| Weighted Push-Up | `weighted-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#weighted-push-up) |
| TRX Chest Press | `trx-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#trx-chest-press) |
| Incline Dumbbell Press | `incline-dumbbell-press` | Same movement | 2026-11-11 | [NASM:incline-db][nasm-incline-db]; [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-presses.md#incline-dumbbell-press) |
| Incline Barbell Bench Press | `incline-barbell-bench-press` | Same movement | 2026-11-11 | [NASM:incline-bb][nasm-incline-bb]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#incline-barbell-bench-press) |
| Incline Machine Press | `incline-machine-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#incline-machine-press) |
| Weighted Dip | `weighted-dip` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#weighted-dip) |
| Cable Fly High to Low | `cable-fly-high-to-low` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#cable-fly-high-to-low) |
| Cable Fly Low to High | `cable-fly-low-to-high` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#cable-fly-low-to-high) |
| Pec Deck | `pec-deck` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#pec-deck) |
| Dumbbell Fly on Stability Ball | `dumbbell-fly-on-stability-ball` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-fly-on-stability-ball) |
| TRX Fly | `trx-fly` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#trx-fly) |
| Deficit Push-Up | `deficit-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#deficit-push-up) |
| Push-Up on Stability Ball | `push-up-on-stability-ball` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#push-up-on-stability-ball) |
| Feet-on-Ball Push-Up | `feet-on-ball-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#feet-on-ball-push-up) |
| Dumbbell Squeeze Press | `dumbbell-squeeze-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-squeeze-press) |
| Standing Barbell Overhead Press | `standing-barbell-overhead-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#standing-barbell-overhead-press) |
| Push Press | `push-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#push-press) |
| Z Press | `z-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#z-press) |
| Seated Dumbbell Shoulder Press | `seated-dumbbell-shoulder-press` | Same movement | 2026-11-11 | [ACE: seated press](https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/)  [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-presses.md#seated-dumbbell-shoulder-press) |
| Standing Dumbbell Shoulder Press | `standing-dumbbell-shoulder-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#standing-dumbbell-shoulder-press) |
| Machine Shoulder Press | `machine-shoulder-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#machine-shoulder-press) |
| Half-Kneeling Landmine Press | `half-kneeling-landmine-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#half-kneeling-landmine-press) |
| Single-Arm Kettlebell Overhead Press | `single-arm-kettlebell-overhead-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#single-arm-kettlebell-overhead-press) |
| Bottoms-Up Kettlebell Press | `bottoms-up-kettlebell-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#bottoms-up-kettlebell-press) |
| Arnold Press | `arnold-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#arnold-press) |
| Half-Kneeling Single-Arm Cable Press | `half-kneeling-single-arm-cable-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#half-kneeling-single-arm-cable-press) |
| Pike Push-Up | `pike-push-up` | Same movement | 2026-11-11 | [NASM:pike][nasm-pike]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#pike-push-up) |
| Dumbbell Lateral Raise | `dumbbell-lateral-raise` | Same movement | 2026-11-11 | [NASM:planes][nasm-planes]; [ACE: lateral raise](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/); [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-lateral-raise) |
| Cable Lateral Raise | `cable-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#cable-lateral-raise) |
| Machine Lateral Raise | `machine-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#machine-lateral-raise) |
| Leaning Single-Arm Lateral Raise | `leaning-single-arm-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#leaning-single-arm-lateral-raise) |
| Lu Raise | `lu-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#lu-raise) |
| Cable Y-Raise | `cable-y-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#cable-y-raise) |
| Y-Raise on Stability Ball | `y-raise-on-stability-ball` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#y-raise-on-stability-ball) |
| Dumbbell Front Raise | `dumbbell-front-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-front-raise) |
| Kettlebell Halo | `kettlebell-halo` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#kettlebell-halo) |
| Cable Rope Pushdown | `cable-rope-pushdown` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#cable-rope-pushdown) |
| Overhead Cable Triceps Extension | `overhead-cable-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#overhead-cable-triceps-extension) |
| Single-Arm Cable Kickback | `single-arm-cable-kickback` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#single-arm-cable-kickback) |
| Dumbbell Skull Crusher | `dumbbell-skull-crusher` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-skull-crusher) |
| Barbell Skull Crusher | `barbell-skull-crusher` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#barbell-skull-crusher) |
| Dumbbell Overhead Triceps Extension | `dumbbell-overhead-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-overhead-triceps-extension) |
| Tate Press | `tate-press` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#tate-press) |
| Machine Triceps Extension | `machine-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#machine-triceps-extension) |
| Bench Dip | `bench-dip` | Same movement | 2026-11-11 | [NASM:bench-dip][nasm-bench-dip]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#bench-dip) |
| Diamond Push-Up | `diamond-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#diamond-push-up) |
| TRX Triceps Extension | `trx-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#trx-triceps-extension) |
| Cable Woodchop High to Low | `cable-woodchop-high-to-low` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#cable-woodchop-high-to-low) |
| Cable Lift Low to High | `cable-lift-low-to-high` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#cable-lift-low-to-high) |
| Pallof Press | `pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#pallof-press) |
| Half-Kneeling Pallof Press | `half-kneeling-pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#half-kneeling-pallof-press) |
| Cable Trunk Rotation | `cable-trunk-rotation` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#cable-trunk-rotation) |
| Landmine Rainbow | `landmine-rainbow` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#landmine-rainbow) |
| Landmine Rotational Push Press | `landmine-rotational-push-press` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#landmine-rotational-push-press) |
| Ball Russian Twist | `ball-russian-twist` | Related only | 2026-11-11 | [NASM:twist][nasm-twist]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#ball-russian-twist) |
| Dumbbell Russian Twist | `dumbbell-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#dumbbell-russian-twist) |
| Kettlebell Windmill | `kettlebell-windmill` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#kettlebell-windmill) |
| Kettlebell Around-the-World | `kettlebell-around-the-world` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#kettlebell-around-the-world) |
| TRX Anti-Rotation Press | `trx-anti-rotation-press` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#trx-anti-rotation-press); [later setup resolution, direct reference and conflicts](TRX-ANTI-ROTATION-2026-11-13.md) |
| Renegade Row | `renegade-row` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#renegade-row) |
| Machine Torso Rotation | `machine-torso-rotation` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#machine-torso-rotation) |
| Hanging Oblique Knee Raise | `hanging-oblique-knee-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#hanging-oblique-knee-raise) |
| Stability Ball Rollout | `stability-ball-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#stability-ball-rollout) |
| Stir the Pot | `stir-the-pot` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#stir-the-pot) |
| Stability Ball Pike | `stability-ball-pike` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#stability-ball-pike) |
| Stability Ball Jackknife | `stability-ball-jackknife` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#stability-ball-jackknife) |
| Ball Crunch | `ball-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#ball-crunch) |
| TRX Body Saw | `trx-body-saw` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#trx-body-saw) |
| TRX Pike | `trx-pike` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#trx-pike) |
| TRX Fallout | `trx-fallout` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#trx-fallout) |
| Hanging Leg Raise | `hanging-leg-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#hanging-leg-raise) |
| Cable Crunch | `cable-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#cable-crunch) |
| Machine Ab Crunch | `machine-ab-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#machine-ab-crunch) |
| Barbell Rollout | `barbell-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#barbell-rollout) |
| Weighted Decline Sit-Up | `weighted-decline-sit-up` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#weighted-decline-sit-up) |
| Dead Bug | `dead-bug` | Same movement | 2026-11-11 | [NASM:dead-bug][nasm-dead-bug]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#dead-bug) |
| Plank | `plank` | Same movement | 2026-11-11 | [NASM:plank][nasm-plank]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#plank) |
| Side Plank | `side-plank` | Same movement | 2026-11-11 | [NASM:side-plank][nasm-side-plank]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#side-plank) |
| Copenhagen Plank | `copenhagen-plank` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#copenhagen-plank) |
| Hollow Body Hold | `hollow-body-hold` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#hollow-body-hold) |
| Dumbbell Farmer's Carry | `dumbbell-farmer-s-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#dumbbell-farmer-s-carry) |
| Kettlebell Farmer's Carry | `kettlebell-farmer-s-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#kettlebell-farmer-s-carry) |
| Suitcase Carry | `suitcase-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#suitcase-carry) |
| Kettlebell Front Rack Carry | `kettlebell-front-rack-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#kettlebell-front-rack-carry) |
| Overhead Kettlebell Carry | `overhead-kettlebell-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#overhead-kettlebell-carry) |
| Mixed Rack and Suitcase Carry | `mixed-rack-and-suitcase-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#mixed-rack-and-suitcase-carry) |
| Weighted Pull-Up | `weighted-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#weighted-pull-up) |
| Chin-Up | `chin-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#chin-up) |
| Neutral-Grip Pull-Up | `neutral-grip-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#neutral-grip-pull-up) |
| L-Sit Pull-Up | `l-sit-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#l-sit-pull-up) |
| Lat Pulldown | `lat-pulldown` | Same movement | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#lat-pulldown) |
| Close-Grip Lat Pulldown | `close-grip-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#close-grip-lat-pulldown) |
| Single-Arm Lat Pulldown | `single-arm-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#single-arm-lat-pulldown) |
| Machine Pulldown | `machine-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#machine-pulldown) |
| Barbell Bent-Over Row | `barbell-bent-over-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#barbell-bent-over-row) |
| Pendlay Row | `pendlay-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#pendlay-row) |
| Seal Row | `seal-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#seal-row) |
| Chest-Supported Dumbbell Row | `chest-supported-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#chest-supported-dumbbell-row) |
| Landmine T-Bar Row | `landmine-t-bar-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#landmine-t-bar-row) |
| Seated Cable Row | `seated-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#seated-cable-row) |
| Machine Row | `machine-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#machine-row) |
| Inverted Row | `inverted-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#inverted-row) |
| TRX Row | `trx-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-row) |
| Kettlebell Gorilla Row | `kettlebell-gorilla-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#kettlebell-gorilla-row) |
| Single-Arm Dumbbell Row | `single-arm-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#single-arm-dumbbell-row) |
| Single-Arm Rotational Cable Row | `single-arm-rotational-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#single-arm-rotational-cable-row) |
| Meadows Row | `meadows-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#meadows-row) |
| Kettlebell Single-Arm Row | `kettlebell-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#kettlebell-single-arm-row) |
| TRX Single-Arm Row | `trx-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-single-arm-row) |
| TRX Power Pull | `trx-power-pull` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-power-pull) |
| Straight-Arm Cable Pulldown | `straight-arm-cable-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#straight-arm-cable-pulldown) |
| Dumbbell Pullover | `dumbbell-pullover` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-pullover) |
| Half-Kneeling Single-Arm Cable Row | `half-kneeling-single-arm-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#half-kneeling-single-arm-cable-row) |
| Ball-Supported Dumbbell Row | `ball-supported-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#ball-supported-dumbbell-row) |
| Cable Face Pull | `cable-face-pull` | Same movement | 2026-11-11 | [NASM:face-pull][nasm-face-pull]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#cable-face-pull) |
| Reverse Pec Deck | `reverse-pec-deck` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#reverse-pec-deck) |
| Bent-Over Dumbbell Reverse Fly | `bent-over-dumbbell-reverse-fly` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#bent-over-dumbbell-reverse-fly) |
| Cable Reverse Fly | `cable-reverse-fly` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#cable-reverse-fly) |
| Incline Dumbbell Rear Delt Row | `incline-dumbbell-rear-delt-row` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#incline-dumbbell-rear-delt-row) |
| TRX Face Pull | `trx-face-pull` | Related only | 2026-11-11 | [NASM:face-pull][nasm-face-pull]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-face-pull) |
| TRX Y-T-W | `trx-y-t-w` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-y-t-w) |
| Ball Prone Y-T-W | `ball-prone-y-t-w` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#ball-prone-y-t-w) |
| Cable External Rotation | `cable-external-rotation` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#cable-external-rotation) |
| Dumbbell Shrug | `dumbbell-shrug` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#dumbbell-shrug) |
| Barbell Curl | `barbell-curl` | Same movement | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#barbell-curl) |
| Incline Dumbbell Curl | `incline-dumbbell-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#incline-dumbbell-curl) |
| Hammer Curl | `hammer-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#hammer-curl) |
| Cable Curl | `cable-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#cable-curl) |
| Bayesian Cable Curl | `bayesian-cable-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#bayesian-cable-curl) |
| Machine Preacher Curl | `machine-preacher-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#machine-preacher-curl) |
| Concentration Curl | `concentration-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#concentration-curl) |
| Zottman Curl | `zottman-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#zottman-curl) |
| Dumbbell Spider Curl | `dumbbell-spider-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#dumbbell-spider-curl) |
| Kettlebell Hammer Curl | `kettlebell-hammer-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#kettlebell-hammer-curl) |
| TRX Biceps Curl | `trx-biceps-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#trx-biceps-curl) |
| Barbell Back Squat | `barbell-back-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#barbell-back-squat) |
| Front Squat | `front-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#front-squat) |
| Zercher Squat | `zercher-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#zercher-squat) |
| Box Squat | `box-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#box-squat) |
| Hack Squat | `hack-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#hack-squat) |
| Leg Press | `leg-press` | Same movement | 2026-11-11 | [NASM:leg-press][nasm-leg-press]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#leg-press) |
| Smith Machine Squat | `smith-machine-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#smith-machine-squat) |
| Goblet Squat | `goblet-squat` | Same movement | 2026-11-11 | [NASM:goblet][nasm-goblet]; [animation comparison](EXERCISE-ANIMATION-BATCH2-2026-11-11.md); [November 13 internal technique notes](exercise-technique/catalog-legs.md#goblet-squat) |
| Double Kettlebell Front Squat | `double-kettlebell-front-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#double-kettlebell-front-squat) |
| Heel-Elevated Dumbbell Squat | `heel-elevated-dumbbell-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#heel-elevated-dumbbell-squat) |
| Stability Ball Wall Squat | `stability-ball-wall-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#stability-ball-wall-squat) |
| Conventional Deadlift | `conventional-deadlift` | Same movement | 2026-11-11 | [NASM:deadlift][nasm-deadlift]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#conventional-deadlift) |
| Sumo Deadlift | `sumo-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#sumo-deadlift) |
| Romanian Deadlift | `romanian-deadlift` | Same movement | 2026-11-11 | [NASM:rdl][nasm-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#romanian-deadlift) |
| Dumbbell Romanian Deadlift | `dumbbell-romanian-deadlift` | Same movement | 2026-11-11 | [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#dumbbell-romanian-deadlift) |
| Double Kettlebell Deadlift | `double-kettlebell-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#double-kettlebell-deadlift) |
| Kettlebell Swing | `kettlebell-swing` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#kettlebell-swing) |
| Good Morning | `good-morning` | Same movement | 2026-11-11 | [NASM:good-morning][nasm-good-morning]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#good-morning) |
| Cable Pull-Through | `cable-pull-through` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cable-pull-through) |
| Weighted Back Extension | `weighted-back-extension` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#weighted-back-extension) |
| Barbell Hip Thrust | `barbell-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#barbell-hip-thrust) |
| B-Stance Hip Thrust | `b-stance-hip-thrust` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#b-stance-hip-thrust) |
| Dumbbell Hip Thrust | `dumbbell-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#dumbbell-hip-thrust) |
| Glute Drive Machine | `glute-drive-machine` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#glute-drive-machine) |
| Single-Leg Hip Thrust | `single-leg-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-hip-thrust) |
| Stability Ball Single-Leg Bridge | `stability-ball-single-leg-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#stability-ball-single-leg-bridge) |
| Cable Glute Kickback | `cable-glute-kickback` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cable-glute-kickback) |
| Bulgarian Split Squat | `bulgarian-split-squat` | Same movement | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#bulgarian-split-squat) |
| Barbell Reverse Lunge | `barbell-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#barbell-reverse-lunge) |
| Dumbbell Walking Lunge | `dumbbell-walking-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#dumbbell-walking-lunge) |
| Front-Foot-Elevated Split Squat | `front-foot-elevated-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#front-foot-elevated-split-squat) |
| Kettlebell Goblet Reverse Lunge | `kettlebell-goblet-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#kettlebell-goblet-reverse-lunge) |
| Step-Up | `step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#step-up) |
| Smith Machine Split Squat | `smith-machine-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#smith-machine-split-squat) |
| Single-Leg Leg Press | `single-leg-leg-press` | Same movement | 2026-11-11 | [NASM:single-press][nasm-single-press]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-leg-press) |
| TRX Single-Leg Squat | `trx-single-leg-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#trx-single-leg-squat) |
| Pistol Squat to Bench | `pistol-squat-to-bench` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#pistol-squat-to-bench) |
| Skater Squat | `skater-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#skater-squat) |
| Single-Leg Romanian Deadlift | `single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-romanian-deadlift) |
| Kettlebell Single-Leg Deadlift | `kettlebell-single-leg-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#kettlebell-single-leg-deadlift) |
| Landmine Single-Leg Romanian Deadlift | `landmine-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#landmine-single-leg-romanian-deadlift) |
| Cable Single-Leg Romanian Deadlift | `cable-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cable-single-leg-romanian-deadlift) |
| B-Stance Romanian Deadlift | `b-stance-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#b-stance-romanian-deadlift) |
| High Step-Up | `high-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#high-step-up) |
| Lateral Lunge | `lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#lateral-lunge) |
| Cossack Squat | `cossack-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cossack-squat) |
| Lateral Step-Up | `lateral-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#lateral-step-up) |
| Landmine Lateral Lunge | `landmine-lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#landmine-lateral-lunge) |
| TRX Lateral Lunge | `trx-lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#trx-lateral-lunge) |
| Curtsy Lunge | `curtsy-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#curtsy-lunge) |
| Transverse Lunge | `transverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#transverse-lunge) |
| Skater Bound | `skater-bound` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#skater-bound) |
| Lying Leg Curl | `lying-leg-curl` | Same movement | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#lying-leg-curl) |
| Seated Leg Curl | `seated-leg-curl` | Same movement | 2026-11-11 | [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#seated-leg-curl) |
| Standing Cable Leg Curl | `standing-cable-leg-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#standing-cable-leg-curl) |
| Dumbbell Leg Curl | `dumbbell-leg-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#dumbbell-leg-curl) |
| Stability Ball Hamstring Curl | `stability-ball-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#stability-ball-hamstring-curl) |
| Single-Leg Ball Hamstring Curl | `single-leg-ball-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-ball-hamstring-curl) |
| TRX Hamstring Curl | `trx-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#trx-hamstring-curl) |
| Nordic Curl | `nordic-curl` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#nordic-curl) |
| Glute-Ham Raise | `glute-ham-raise` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#glute-ham-raise) |
| Leg Extension | `leg-extension` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#leg-extension) |
| Single-Leg Extension | `single-leg-extension` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-extension) |
| Sissy Squat | `sissy-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#sissy-squat) |
| Reverse Nordic | `reverse-nordic` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#reverse-nordic) |
| Peterson Step-Up | `peterson-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#peterson-step-up) |
| Hip Adduction Machine | `hip-adduction-machine` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#hip-adduction-machine) |
| Hip Abduction Machine | `hip-abduction-machine` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#hip-abduction-machine) |
| Cable Hip Abduction | `cable-hip-abduction` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cable-hip-abduction) |
| Cable Hip Adduction | `cable-hip-adduction` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#cable-hip-adduction) |
| Stability Ball Squeeze Bridge | `stability-ball-squeeze-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#stability-ball-squeeze-bridge) |
| Side-Lying Hip Abduction | `side-lying-hip-abduction` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#side-lying-hip-abduction) |
| Standing Calf Raise Machine | `standing-calf-raise-machine` | Related only | 2026-11-11 | [NASM:calf][nasm-calf]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#standing-calf-raise-machine) |
| Seated Calf Raise | `seated-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#seated-calf-raise) |
| Leg Press Calf Raise | `leg-press-calf-raise` | Same movement | 2026-11-11 | [NASM:calf][nasm-calf]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#leg-press-calf-raise) |
| Single-Leg Dumbbell Calf Raise | `single-leg-dumbbell-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#single-leg-dumbbell-calf-raise) |
| Barbell Calf Raise | `barbell-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#barbell-calf-raise) |
| Tibialis Raise | `tibialis-raise` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#tibialis-raise) |
| Box Step-Up | `box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#box-step-up) |
| Lateral Box Step-Up | `lateral-box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#lateral-box-step-up) |
| Crossover Box Step-Up | `crossover-box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#crossover-box-step-up) |
| Box Step-Up with Knee Drive | `box-step-up-with-knee-drive` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#box-step-up-with-knee-drive) |
| Eccentric Box Step-Down | `eccentric-box-step-down` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#eccentric-box-step-down) |
| Box Bulgarian Split Squat | `box-bulgarian-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#box-bulgarian-split-squat) |
| Feet-on-Box Decline Push-Up | `feet-on-box-decline-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#feet-on-box-decline-push-up) |
| Box Jump | `box-jump` | Same movement | 2026-11-11 | [NASM:box-jump][nasm-box-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#box-jump) |
| Seated Box Jump | `seated-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#seated-box-jump) |
| Depth Jump | `depth-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#depth-jump) |
| Lateral Box Jump | `lateral-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#lateral-box-jump) |
| Single-Leg Box Jump | `single-leg-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#single-leg-box-jump) |
| Broad Jump | `broad-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#broad-jump) |
| Squat Jump | `squat-jump` | Same movement | 2026-11-11 | [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#squat-jump) |
| Approach Vertical Jump | `approach-vertical-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#approach-vertical-jump) |
| Tuck Jump | `tuck-jump` | Same movement | 2026-11-11 | [NASM:tuck-jump][nasm-tuck-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#tuck-jump) |
| Split Squat Jump | `split-squat-jump` | Same movement | 2026-11-11 | [NASM:lunge-jump][nasm-lunge-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#split-squat-jump) |
| Lateral Bound | `lateral-bound` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#lateral-bound) |
| 180 Degree Rotational Jump | `180-degree-rotational-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#180-degree-rotational-jump) |
| Single-Leg Lateral Hop | `single-leg-lateral-hop` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#single-leg-lateral-hop) |
| Pogo Hops | `pogo-hops` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#pogo-hops) |
| Dumbbell Jump Squat | `dumbbell-jump-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#dumbbell-jump-squat) |
| Side Step Lunge | `side-step-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#side-step-lunge) |
| Side Step Lunge to Balance | `side-step-lunge-to-balance` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#side-step-lunge-to-balance) |
| Hanging Knee Raise | `hanging-knee-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#hanging-knee-raise) |
| Band Pull-Apart | `band-pull-apart` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#band-pull-apart) |
| Band Face Pull | `band-face-pull` | Related only | 2026-11-11 | [NASM:face-pull][nasm-face-pull]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#band-face-pull) |
| Band-Assisted Archer Pull-Up | `band-assisted-archer-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#band-assisted-archer-pull-up) |
| Kneeling Band Lat Pulldown | `kneeling-band-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#kneeling-band-lat-pulldown) |
| Band Seated Row | `band-seated-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#band-seated-row) |
| Tube Single-Arm Row | `tube-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#tube-single-arm-row) |
| Anchored Band Chest Press | `anchored-band-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#anchored-band-chest-press) |
| Banded Push-Up | `banded-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#banded-push-up) |
| Band Overhead Press | `band-overhead-press` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-presses.md#band-overhead-press) |
| Band Lateral Raise | `band-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#band-lateral-raise) |
| Band Triceps Pushdown | `band-triceps-pushdown` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#band-triceps-pushdown) |
| Band Biceps Curl | `band-biceps-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#band-biceps-curl) |
| Band Pallof Press | `band-pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#band-pallof-press) |
| Band Woodchop | `band-woodchop` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#band-woodchop) |
| Mini-Band Lateral Walk | `mini-band-lateral-walk` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#mini-band-lateral-walk) |
| Mini-Band Monster Walk | `mini-band-monster-walk` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#mini-band-monster-walk) |
| Banded Clamshell | `banded-clamshell` | Same movement | 2026-11-11 | [NASM:clamshell][nasm-clamshell]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#banded-clamshell) |
| Banded Glute Bridge | `banded-glute-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#banded-glute-bridge) |
| Band Pull-Through | `band-pull-through` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#band-pull-through) |
| Band Good Morning | `band-good-morning` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#band-good-morning) |
| Prone Band Hamstring Curl | `prone-band-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#prone-band-hamstring-curl) |
| Battle Rope Alternating Waves | `battle-rope-alternating-waves` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#battle-rope-alternating-waves) |
| Battle Rope Side-to-Side Waves | `battle-rope-side-to-side-waves` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#battle-rope-side-to-side-waves) |
| Battle Rope Rotational Slams | `battle-rope-rotational-slams` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#battle-rope-rotational-slams) |
| Battle Rope Double Slams | `battle-rope-double-slams` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#battle-rope-double-slams) |
| Battle Rope Lateral Shuffle Waves | `battle-rope-lateral-shuffle-waves` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#battle-rope-lateral-shuffle-waves) |
| Medicine Ball Slam | `medicine-ball-slam` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-slam) |
| Rotational Medicine Ball Slam | `rotational-medicine-ball-slam` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#rotational-medicine-ball-slam) |
| Medicine Ball Rotational Scoop Toss | `medicine-ball-rotational-scoop-toss` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-rotational-scoop-toss) |
| Medicine Ball Shot Put Throw | `medicine-ball-shot-put-throw` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-shot-put-throw) |
| Medicine Ball Chest Pass | `medicine-ball-chest-pass` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-chest-pass) |
| Medicine Ball Overhead Wall Throw | `medicine-ball-overhead-wall-throw` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-overhead-wall-throw) |
| Medicine Ball Vertical Toss | `medicine-ball-vertical-toss` | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#medicine-ball-vertical-toss) |
| Medicine Ball Russian Twist | `medicine-ball-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#medicine-ball-russian-twist) |
| Medicine Ball V-Up | `medicine-ball-v-up` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#medicine-ball-v-up) |
| Medicine Ball Push-Up | `medicine-ball-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#medicine-ball-push-up) |
| Medicine Ball Lunge with Rotation | `medicine-ball-lunge-with-rotation` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#medicine-ball-lunge-with-rotation) |
| Medicine Ball Woodchop | `medicine-ball-woodchop` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#medicine-ball-woodchop) |
| BOSU Squat | `bosu-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#bosu-squat) |
| BOSU Push-Up | `bosu-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#bosu-push-up) |
| BOSU Mountain Climber | `bosu-mountain-climber` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#bosu-mountain-climber) |
| BOSU Single-Leg Romanian Deadlift | `bosu-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#bosu-single-leg-romanian-deadlift) |
| BOSU Lateral Step-Over | `bosu-lateral-step-over` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#bosu-lateral-step-over) |
| BOSU Reverse Lunge | `bosu-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#bosu-reverse-lunge) |
| BOSU Side Plank | `bosu-side-plank` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#bosu-side-plank) |
| BOSU Squat Jump | `bosu-squat-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#bosu-squat-jump) |
| Monkey Bar Traverse | `monkey-bar-traverse` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#monkey-bar-traverse) |
| Toes-to-Bar | `toes-to-bar` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#toes-to-bar) |
| Hanging Windshield Wiper | `hanging-windshield-wiper` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#hanging-windshield-wiper) |
| Commando Pull-Up | `commando-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#commando-pull-up) |
| Archer Pull-Up | `archer-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#archer-pull-up) |
| Plate Front Raise | `plate-front-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#plate-front-raise) |
| Plate Halo | `plate-halo` | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#plate-halo) |
| Plate Pinch Carry | `plate-pinch-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#plate-pinch-carry) |
| Plate Russian Twist | `plate-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#plate-russian-twist) |
| Turkish Get-Up | `turkish-get-up` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#turkish-get-up) |
| Kettlebell Clean and Press | `kettlebell-clean-and-press` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#kettlebell-clean-and-press) |
| Kettlebell Snatch | `kettlebell-snatch` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics]; [November 13 internal technique notes](exercise-technique/catalog-power-and-conditioning.md#kettlebell-snatch) |
| Smith Machine Hip Thrust | `smith-machine-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#smith-machine-hip-thrust) |
| Dumbbell Glute Bridge | `dumbbell-glute-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#dumbbell-glute-bridge) |
| Trap Bar Deadlift | `trap-bar-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#trap-bar-deadlift) |
| EZ-Bar Curl | `ez-bar-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#ez-bar-curl) |
| Assisted Pull-Up Machine | `assisted-pull-up-machine` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up]; [November 13 internal technique notes](exercise-technique/catalog-pulls.md#assisted-pull-up-machine) |
| Assisted Dip Machine | `assisted-dip-machine` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press]; [November 13 internal technique notes](exercise-technique/catalog-presses.md#assisted-dip-machine) |
| Sled Push | `sled-push` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#sled-push) |
| Sled Pull | `sled-pull` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#sled-pull) |
| Sandbag Bear-Hug Carry | `sandbag-bear-hug-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#sandbag-bear-hug-carry) |
| Sandbag Squat | `sandbag-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#sandbag-squat) |
| Ab Wheel Rollout | `ab-wheel-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core]; [November 13 internal technique notes](exercise-technique/catalog-core-and-carries.md#ab-wheel-rollout) |
| Ankle-Weight Glute Kickback | `ankle-weight-glute-kickback` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#ankle-weight-glute-kickback) |
| Ankle-Weight Side-Lying Leg Raise | `ankle-weight-side-lying-leg-raise` | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/catalog-legs.md#ankle-weight-side-lying-leg-raise) |
| Back Extension | `back-extension` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional]; [November 13 internal technique notes](exercise-technique/catalog-legs.md#back-extension) |

## Warm-up and stretch guide associations

These 92 entries retain their exact app lookup names. There are eight same-movement comparisons, 24 related references and 60 without a suitable reference.

| Guide name | Reference coverage | Reviewed | Sources |
| --- | --- | --- | --- |
| A-skips | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#a-skips) |
| Arm circles | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#arm-circles) |
| Band dislocates | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#band-dislocates) |
| Band pull-aparts | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#band-pull-aparts) |
| Banded lateral walks | Related only | 2026-11-11 | [NASM:clamshell][nasm-clamshell]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#banded-lateral-walks) |
| Lateral band walks | Related only | 2026-11-11 | [NASM:clamshell][nasm-clamshell]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#lateral-band-walks) |
| Bodyweight squats to a bench | Related only | 2026-11-11 | [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#bodyweight-squats-to-a-bench) |
| Broad jumps | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#broad-jumps) |
| Broomstick or towel pass-throughs | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#broomstick-or-towel-pass-throughs) |
| Cat-cow | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#cat-cow) |
| Dead hang | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#dead-hang) |
| Downward dog to plank | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#downward-dog-to-plank) |
| Explosive push-ups | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#explosive-push-ups) |
| Fast bodyweight squats | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#fast-bodyweight-squats) |
| Fast incline push-ups | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#fast-incline-push-ups) |
| Glute bridges | Same movement | 2026-11-11 | [NASM:bridge][nasm-bridge]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#glute-bridges) |
| Half-kneeling hip flexor stretch with reach | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#half-kneeling-hip-flexor-stretch-with-reach) |
| High-knee marches | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#high-knee-marches) |
| Hip circles | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#hip-circles) |
| Hug-yourself twists | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#hug-yourself-twists) |
| Inchworms | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#inchworms) |
| Incline push-ups on a bench | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#incline-push-ups-on-a-bench) |
| Incline push-ups | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#incline-push-ups) |
| Lat stretch holding a post | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#lat-stretch-holding-a-post) |
| Lateral shuffles | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#lateral-shuffles) |
| Leg swings, front to back and side to side | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#leg-swings-front-to-back-and-side-to-side) |
| Leg swings, front to back | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#leg-swings-front-to-back) |
| Low box jumps | Same movement | 2026-11-11 | [NASM:box-jump][nasm-box-jump]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#low-box-jumps) |
| Marching knee lifts | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#marching-knee-lifts) |
| Medicine ball chest pass | Related only | 2026-11-11 | [NASM:power][nasm-power]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#medicine-ball-chest-pass) |
| Open books lying on your side | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#open-books-lying-on-your-side) |
| Thoracic open books | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#thoracic-open-books) |
| Prone Y-T-W raises | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#prone-y-t-w-raises) |
| Push-up to downward dog | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#push-up-to-downward-dog) |
| Push-ups | Same movement | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#push-ups) |
| Reach-and-pull | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#reach-and-pull) |
| Reverse arm swings | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#reverse-arm-swings) |
| Reverse lunges in place | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#reverse-lunges-in-place) |
| Scap pull-ups | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#scap-pull-ups) |
| Scap push-ups | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#scap-push-ups) |
| Side lunges | Related only | 2026-11-11 | [NASM:planes][nasm-planes]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#side-lunges) |
| Bodyweight good mornings | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#bodyweight-good-mornings) |
| Calf raises | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#calf-raises) |
| Deep squat hold | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#deep-squat-hold) |
| Bodyweight squats | Related only | 2026-11-11 | [NASM:prisoner][nasm-prisoner]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#bodyweight-squats) |
| Quadruped hip circles | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#quadruped-hip-circles) |
| Bird dogs | Same movement | 2026-11-11 | [NASM:bird][nasm-bird]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#bird-dogs) |
| Dead bugs | Same movement | 2026-11-11 | [NASM:dead-bug][nasm-dead-bug]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#dead-bugs) |
| Plank shoulder taps | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#plank-shoulder-taps) |
| Spiderman lunge with reach | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#spiderman-lunge-with-reach) |
| Cossack squats | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#cossack-squats) |
| Goblet squat pry | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#goblet-squat-pry) |
| Kettlebell halos | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#kettlebell-halos) |
| Band face pulls | Same movement | 2026-11-11 | [NASM:face-pull][nasm-face-pull]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#band-face-pulls) |
| Ankle rocks against a wall | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#ankle-rocks-against-a-wall) |
| Hip airplanes | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#hip-airplanes) |
| Single-leg glute bridges | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#single-leg-glute-bridges) |
| Quadruped T-spine reach | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#quadruped-t-spine-reach) |
| Seated twists | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#seated-twists) |
| Seated twist | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#seated-twist) |
| Shoulder rolls | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#shoulder-rolls) |
| Shoulder taps on the wall | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#shoulder-taps-on-the-wall) |
| Sit-to-stands from a chair | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#sit-to-stands-from-a-chair) |
| Split squat holds | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#split-squat-holds) |
| Standing back arch and round | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#standing-back-arch-and-round) |
| Standing hip extensions | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#standing-hip-extensions) |
| Standing knee hugs | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#standing-knee-hugs) |
| Walking knee hugs | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#walking-knee-hugs) |
| Thoracic rotations on hands and knees | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#thoracic-rotations-on-hands-and-knees) |
| Thread the needle | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#thread-the-needle) |
| Walking lunges | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#walking-lunges) |
| Wall push-ups | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#wall-push-ups) |
| Wall sit | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#wall-sit) |
| Wall slides | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#wall-slides) |
| World’s greatest stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#world-s-greatest-stretch) |
| Biceps wall stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#biceps-wall-stretch) |
| Butterfly stretch | Same movement | 2026-11-11 | [NASM:butterfly][nasm-butterfly]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#butterfly-stretch) |
| Calf stretch on a wall | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#calf-stretch-on-a-wall) |
| Child’s pose | Same movement | 2026-11-11 | [NASM:child][nasm-child]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#child-s-pose) |
| Cobra stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#cobra-stretch) |
| Cross-body shoulder stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#cross-body-shoulder-stretch) |
| Doorway chest stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#doorway-chest-stretch) |
| Figure-4 glute stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#figure-4-glute-stretch) |
| Half-kneeling hip flexor stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#half-kneeling-hip-flexor-stretch) |
| Hands-behind-back chest opener | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#hands-behind-back-chest-opener) |
| Kneeling shin stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#kneeling-shin-stretch) |
| Lying cross-body glute stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#lying-cross-body-glute-stretch) |
| Neck side stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#neck-side-stretch) |
| Overhead triceps stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#overhead-triceps-stretch) |
| Seated hamstring stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching]; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#seated-hamstring-stretch) |
| Standing quad stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#standing-quad-stretch) |
| Wrist flexor and extensor stretch | No suitable reference | 2026-11-11 | None recorded; [November 13 internal technique notes](exercise-technique/warmups-and-stretches.md#wrist-flexor-and-extensor-stretch) |

## Initial source directory

Publisher for every source in this initial directory: National Academy of Sports Medicine (NASM). These are the URLs retained by the original audit, including sources with documented problems. See its [source-conflict notes](EXERCISE-AUDIT-2026-11-11.md#source-conflicts-and-retained-differences). A source being listed does not mean every section was accepted as accurate, or that it was associated with a catalog entry.

| Source key | Page/document title | Underlying review date |
| --- | --- | --- |
| [NASM:bench][nasm-bench] | Barbell Bench Press | 2026-11-11 |
| [NASM:db-rdl][nasm-db-rdl] | Dumbbell Romanian Deadlift | 2026-11-11 |
| [NASM:rdl][nasm-rdl] | Romanian Deadlift Barbell | 2026-11-11 |
| [NASM:good-morning][nasm-good-morning] | Good Mornings | 2026-11-11 |
| [NASM:deadlift][nasm-deadlift] | Barbell Deadlift | 2026-11-11 |
| [NASM:kb-deadlift][nasm-kb-deadlift] | Kettlebell Deadlift | 2026-11-11 |
| [NASM:leg-press][nasm-leg-press] | Leg Press | 2026-11-11 |
| [NASM:single-press][nasm-single-press] | Single-Leg Press | 2026-11-11 |
| [NASM:lying-curl][nasm-lying-curl] | Lying Leg Curl | 2026-11-11 |
| [NASM:seated-curl][nasm-seated-curl] | Seated Leg Curl | 2026-11-11 |
| [NASM:plank][nasm-plank] | Plank | 2026-11-11 |
| [NASM:side-plank][nasm-side-plank] | Side Plank | 2026-11-11 |
| [NASM:dead-bug][nasm-dead-bug] | Dead Bug | 2026-11-11 |
| [NASM:bridge][nasm-bridge] | Floor Bridge | 2026-11-11 |
| [NASM:bulgarian][nasm-bulgarian] | Bulgarian Split Squat | 2026-11-11 |
| [NASM:goblet][nasm-goblet] | Goblet Squat | 2026-11-11 |
| [NASM:kb-squat][nasm-kb-squat] | Kettlebell Front Squat | 2026-11-11 |
| [NASM:prisoner][nasm-prisoner] | Prisoner Squat | 2026-11-11 |
| [NASM:box-jump][nasm-box-jump] | Box Jumps | 2026-11-11 |
| [NASM:squat-jump][nasm-squat-jump] | Squat Jump | 2026-11-11 |
| [NASM:tuck-jump][nasm-tuck-jump] | Tuck Jump | 2026-11-11 |
| [NASM:lunge-jump][nasm-lunge-jump] | Lunge Jump | 2026-11-11 |
| [NASM:push-up][nasm-push-up] | Push-Up | 2026-11-11 |
| [NASM:pike][nasm-pike] | Pike Push-Up | 2026-11-11 |
| [NASM:pull-up][nasm-pull-up] | Pull-Up | 2026-11-11 |
| [NASM:curl][nasm-curl] | Barbell Bicep Curl | 2026-11-11 |
| [NASM:face-pull][nasm-face-pull] | Face Pull | 2026-11-11 |
| [NASM:calf][nasm-calf] | Leg Press Calf Raise | 2026-11-11 |
| [NASM:bench-dip][nasm-bench-dip] | Bench Dips | 2026-11-11 |
| [NASM:twist][nasm-twist] | Russian Twist | 2026-11-11 |
| [NASM:machine-press][nasm-machine-press] | Chest Press Machine | 2026-11-11 |
| [NASM:single-db-press][nasm-single-db-press] | Single-Arm Dumbbell Chest Press | 2026-11-11 |
| [NASM:incline-db][nasm-incline-db] | Two-Arm Incline Dumbbell Chest Press | 2026-11-11 |
| [NASM:incline-bb][nasm-incline-bb] | Incline Barbell Bench Press | 2026-11-11 |
| [NASM:close-press][nasm-close-press] | Close Grip Bench Press | 2026-11-11 |
| [NASM:fly][nasm-fly] | Cable Crossover | 2026-11-11 |
| [NASM:bird][nasm-bird] | Bird Dog | 2026-11-11 |
| [NASM:child][nasm-child] | Child's Pose | 2026-11-11 |
| [NASM:butterfly][nasm-butterfly] | Static Butterfly Stretch | 2026-11-11 |
| [NASM:core][nasm-core] | Core Programming That Translates to Real Life | 2026-11-11 |
| [NASM:functional][nasm-functional] | Functional Strength Training | 2026-11-11 |
| [NASM:stretching][nasm-stretching] | Stretches for Beginners | 2026-11-11 |
| [NASM:planes][nasm-planes] | The 3 Planes of Motion Explained | 2026-11-11 |
| [NASM:clamshell][nasm-clamshell] | The Banded Clamshell | 2026-11-11 |
| [NASM:pulldown][nasm-pulldown] | The Biomechanics of the Lat Pulldown | 2026-11-11 |
| [NASM:talk][nasm-talk] | Heart Rate Training Zones Explained | 2026-11-11 |
| [NASM:power][nasm-power] | NASM OPT Model: power movement examples | 2026-11-11 |
| [NASM:kb-ballistics][nasm-kb-ballistics] | Integrated Kettlebell Training | 2026-11-11 |
| [NASM:hinge-guide][nasm-hinge-guide] | Squats and Deadlifts guide | 2026-11-11 |
| [NASM:arms][nasm-arms] | 9 Best Arm Exercises (source contains anatomy errors; limited use) | 2026-11-11 |

[nasm-bench]: https://www.nasm.org/resource-center/exercise-library/barbell-bench-press
[nasm-db-rdl]: https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift
[nasm-rdl]: https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell
[nasm-good-morning]: https://www.nasm.org/resource-center/exercise-library/good-mornings
[nasm-deadlift]: https://www.nasm.org/resource-center/exercise-library/barbell-deadlift
[nasm-kb-deadlift]: https://www.nasm.org/resource-center/exercise-library/kettlebell-deadlift
[nasm-leg-press]: https://www.nasm.org/resource-center/exercise-library/leg-press
[nasm-single-press]: https://www.nasm.org/resource-center/exercise-library/single-leg-press
[nasm-lying-curl]: https://www.nasm.org/resource-center/exercise-library/lying-leg-curl
[nasm-seated-curl]: https://www.nasm.org/resource-center/exercise-library/seated-leg-curl
[nasm-plank]: https://www.nasm.org/resource-center/exercise-library/plank
[nasm-side-plank]: https://www.nasm.org/resource-center/exercise-library/side-plank
[nasm-dead-bug]: https://www.nasm.org/resource-center/exercise-library/dead-bug
[nasm-bridge]: https://www.nasm.org/resource-center/exercise-library/floor-bridge
[nasm-bulgarian]: https://www.nasm.org/resource-center/exercise-library/bulgarian-split-squat
[nasm-goblet]: https://www.nasm.org/resource-center/exercise-library/goblet-squat
[nasm-kb-squat]: https://www.nasm.org/resource-center/exercise-library/kettlebell-front-squat
[nasm-prisoner]: https://www.nasm.org/resource-center/exercise-library/prisoner-squat
[nasm-box-jump]: https://www.nasm.org/resource-center/exercise-library/box-jumps
[nasm-squat-jump]: https://www.nasm.org/resource-center/exercise-library/squat-jump
[nasm-tuck-jump]: https://www.nasm.org/resource-center/exercise-library/tuck-jump
[nasm-lunge-jump]: https://www.nasm.org/resource-center/exercise-library/lunge-jump
[nasm-push-up]: https://www.nasm.org/resource-center/exercise-library/push-up
[nasm-pike]: https://www.nasm.org/resource-center/exercise-library/pike-push-up
[nasm-pull-up]: https://www.nasm.org/resource-center/exercise-library/pull-up
[nasm-curl]: https://www.nasm.org/resource-center/exercise-library/barbell-bicep-curl
[nasm-face-pull]: https://www.nasm.org/resource-center/exercise-library/face-pull
[nasm-calf]: https://www.nasm.org/resource-center/exercise-library/leg-press-calf-raise
[nasm-bench-dip]: https://www.nasm.org/resource-center/exercise-library/bench-dips
[nasm-twist]: https://www.nasm.org/resource-center/exercise-library/russian-twist
[nasm-machine-press]: https://www.nasm.org/resource-center/exercise-library/chest-press-machine
[nasm-single-db-press]: https://www.nasm.org/resource-center/exercise-library/single-arm-dumbbell-chest-press
[nasm-incline-db]: https://www.nasm.org/resource-center/exercise-library/two-arm-incline-dumbbell-chest-press
[nasm-incline-bb]: https://www.nasm.org/resource-center/exercise-library/incline-barbell-bench-press
[nasm-close-press]: https://www.nasm.org/resource-center/exercise-library/close-grip-bench-press
[nasm-fly]: https://www.nasm.org/resource-center/exercise-library/cable-crossover
[nasm-bird]: https://www.nasm.org/resource-center/exercise-library/bird-dog
[nasm-child]: https://www.nasm.org/resource-center/exercise-library/childs-pose
[nasm-butterfly]: https://www.nasm.org/resource-center/exercise-library/static-butterfly-stretch
[nasm-core]: https://www.nasm.org/resource-center/blog/training/core-training-programming
[nasm-functional]: https://www.nasm.org/resource-center/blog/training/functional-strength-training
[nasm-stretching]: https://www.nasm.org/resource-center/blog/recovery/stretches-for-beginners
[nasm-planes]: https://www.nasm.org/resource-center/blog/training/the-3-planes-of-motion-explained-with-exercises
[nasm-clamshell]: https://www.nasm.org/resource-center/blog/training/the-banded-clamshell-a-simple-move-for-stronger-glutes
[nasm-pulldown]: https://www.nasm.org/resource-center/blog/training/the-biomechanics-of-the-lat-pulldown-muscles-grip-and-form
[nasm-talk]: https://www.nasm.org/resource-center/blog/heart-rate-training-zones-explained
[nasm-power]: https://www.nasm.org/certified-personal-trainer/the-opt-model
[nasm-kb-ballistics]: https://www.nasm.org/docs/default-source/pdf/integrated-kettlebell-2014-2-day.pdf
[nasm-hinge-guide]: https://trainer.nasm.org/hubfs/NASM_Free%20Guide_Squats%20and%20Deadlifts.pdf?hsLang=en
[nasm-arms]: https://blog.nasm.org/workout-plans/9-best-arm-exercises/
