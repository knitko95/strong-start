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

No additional publisher has been audited in this register yet. Later ACE, NHS or other source reviews can be recorded alongside NASM without replacing its references. This statement does not claim those future pages have been inspected.

## Catalog exercise associations

The date shown is the underlying audit date. The initial coverage is 33 same-movement comparisons, 244 related references and 43 entries without a suitable reference. Use the dated evidence inventory for each entry's findings and changed fields. Source keys below link directly to the original page; titles are listed in the source directory.

| Exercise | App ID | Reference coverage | Reviewed | Sources |
| --- | --- | --- | --- | --- |
| Barbell Bench Press | `barbell-bench-press` | Same movement | 2026-11-11 | [NASM:bench][nasm-bench] |
| Dumbbell Bench Press | `dumbbell-bench-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Close-Grip Bench Press | `close-grip-bench-press` | Same movement | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Smith Machine Bench Press | `smith-machine-bench-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Machine Chest Press | `machine-chest-press` | Same movement | 2026-11-11 | [NASM:machine-press][nasm-machine-press] |
| Standing Cable Chest Press | `standing-cable-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Single-Arm Cable Chest Press | `single-arm-cable-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Single-Arm Dumbbell Bench Press | `single-arm-dumbbell-bench-press` | Same movement | 2026-11-11 | [NASM:single-db-press][nasm-single-db-press] |
| Dumbbell Floor Press | `dumbbell-floor-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Kettlebell Floor Press | `kettlebell-floor-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Weighted Push-Up | `weighted-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| TRX Chest Press | `trx-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Incline Dumbbell Press | `incline-dumbbell-press` | Same movement | 2026-11-11 | [NASM:incline-db][nasm-incline-db] |
| Incline Barbell Bench Press | `incline-barbell-bench-press` | Same movement | 2026-11-11 | [NASM:incline-bb][nasm-incline-bb] |
| Incline Machine Press | `incline-machine-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Weighted Dip | `weighted-dip` | No suitable reference | 2026-11-11 | None recorded |
| Cable Fly High to Low | `cable-fly-high-to-low` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Cable Fly Low to High | `cable-fly-low-to-high` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Pec Deck | `pec-deck` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Dumbbell Fly on Stability Ball | `dumbbell-fly-on-stability-ball` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| TRX Fly | `trx-fly` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Deficit Push-Up | `deficit-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Push-Up on Stability Ball | `push-up-on-stability-ball` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Feet-on-Ball Push-Up | `feet-on-ball-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Dumbbell Squeeze Press | `dumbbell-squeeze-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Standing Barbell Overhead Press | `standing-barbell-overhead-press` | No suitable reference | 2026-11-11 | None recorded |
| Push Press | `push-press` | No suitable reference | 2026-11-11 | None recorded |
| Z Press | `z-press` | No suitable reference | 2026-11-11 | None recorded |
| Seated Dumbbell Shoulder Press | `seated-dumbbell-shoulder-press` | No suitable reference | 2026-11-11 | None recorded |
| Standing Dumbbell Shoulder Press | `standing-dumbbell-shoulder-press` | No suitable reference | 2026-11-11 | None recorded |
| Machine Shoulder Press | `machine-shoulder-press` | No suitable reference | 2026-11-11 | None recorded |
| Half-Kneeling Landmine Press | `half-kneeling-landmine-press` | No suitable reference | 2026-11-11 | None recorded |
| Single-Arm Kettlebell Overhead Press | `single-arm-kettlebell-overhead-press` | No suitable reference | 2026-11-11 | None recorded |
| Bottoms-Up Kettlebell Press | `bottoms-up-kettlebell-press` | No suitable reference | 2026-11-11 | None recorded |
| Arnold Press | `arnold-press` | No suitable reference | 2026-11-11 | None recorded |
| Half-Kneeling Single-Arm Cable Press | `half-kneeling-single-arm-cable-press` | No suitable reference | 2026-11-11 | None recorded |
| Pike Push-Up | `pike-push-up` | Same movement | 2026-11-11 | [NASM:pike][nasm-pike] |
| Dumbbell Lateral Raise | `dumbbell-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Cable Lateral Raise | `cable-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Machine Lateral Raise | `machine-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Leaning Single-Arm Lateral Raise | `leaning-single-arm-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Lu Raise | `lu-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Cable Y-Raise | `cable-y-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Y-Raise on Stability Ball | `y-raise-on-stability-ball` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Dumbbell Front Raise | `dumbbell-front-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Kettlebell Halo | `kettlebell-halo` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Cable Rope Pushdown | `cable-rope-pushdown` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Overhead Cable Triceps Extension | `overhead-cable-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Single-Arm Cable Kickback | `single-arm-cable-kickback` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Dumbbell Skull Crusher | `dumbbell-skull-crusher` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Barbell Skull Crusher | `barbell-skull-crusher` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Dumbbell Overhead Triceps Extension | `dumbbell-overhead-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Tate Press | `tate-press` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Machine Triceps Extension | `machine-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Bench Dip | `bench-dip` | Same movement | 2026-11-11 | [NASM:bench-dip][nasm-bench-dip] |
| Diamond Push-Up | `diamond-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| TRX Triceps Extension | `trx-triceps-extension` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Cable Woodchop High to Low | `cable-woodchop-high-to-low` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Cable Lift Low to High | `cable-lift-low-to-high` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Pallof Press | `pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Half-Kneeling Pallof Press | `half-kneeling-pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Cable Trunk Rotation | `cable-trunk-rotation` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Landmine Rainbow | `landmine-rainbow` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Landmine Rotational Push Press | `landmine-rotational-push-press` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Ball Russian Twist | `ball-russian-twist` | Related only | 2026-11-11 | [NASM:twist][nasm-twist] |
| Dumbbell Russian Twist | `dumbbell-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist] |
| Kettlebell Windmill | `kettlebell-windmill` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Kettlebell Around-the-World | `kettlebell-around-the-world` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| TRX Anti-Rotation Press | `trx-anti-rotation-press` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Renegade Row | `renegade-row` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Machine Torso Rotation | `machine-torso-rotation` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Hanging Oblique Knee Raise | `hanging-oblique-knee-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Stability Ball Rollout | `stability-ball-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Stir the Pot | `stir-the-pot` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Stability Ball Pike | `stability-ball-pike` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Stability Ball Jackknife | `stability-ball-jackknife` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Ball Crunch | `ball-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| TRX Body Saw | `trx-body-saw` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| TRX Pike | `trx-pike` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| TRX Fallout | `trx-fallout` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Hanging Leg Raise | `hanging-leg-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Cable Crunch | `cable-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Machine Ab Crunch | `machine-ab-crunch` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Barbell Rollout | `barbell-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Weighted Decline Sit-Up | `weighted-decline-sit-up` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Dead Bug | `dead-bug` | Same movement | 2026-11-11 | [NASM:dead-bug][nasm-dead-bug] |
| Plank | `plank` | Same movement | 2026-11-11 | [NASM:plank][nasm-plank] |
| Side Plank | `side-plank` | Same movement | 2026-11-11 | [NASM:side-plank][nasm-side-plank] |
| Copenhagen Plank | `copenhagen-plank` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Hollow Body Hold | `hollow-body-hold` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Dumbbell Farmer's Carry | `dumbbell-farmer-s-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Kettlebell Farmer's Carry | `kettlebell-farmer-s-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Suitcase Carry | `suitcase-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Kettlebell Front Rack Carry | `kettlebell-front-rack-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Overhead Kettlebell Carry | `overhead-kettlebell-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Mixed Rack and Suitcase Carry | `mixed-rack-and-suitcase-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Weighted Pull-Up | `weighted-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Chin-Up | `chin-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Neutral-Grip Pull-Up | `neutral-grip-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| L-Sit Pull-Up | `l-sit-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Lat Pulldown | `lat-pulldown` | Same movement | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Close-Grip Lat Pulldown | `close-grip-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Single-Arm Lat Pulldown | `single-arm-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Machine Pulldown | `machine-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Barbell Bent-Over Row | `barbell-bent-over-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Pendlay Row | `pendlay-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Seal Row | `seal-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Chest-Supported Dumbbell Row | `chest-supported-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Landmine T-Bar Row | `landmine-t-bar-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Seated Cable Row | `seated-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Machine Row | `machine-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Inverted Row | `inverted-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| TRX Row | `trx-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Kettlebell Gorilla Row | `kettlebell-gorilla-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Single-Arm Dumbbell Row | `single-arm-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Single-Arm Rotational Cable Row | `single-arm-rotational-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Meadows Row | `meadows-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Kettlebell Single-Arm Row | `kettlebell-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| TRX Single-Arm Row | `trx-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| TRX Power Pull | `trx-power-pull` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Straight-Arm Cable Pulldown | `straight-arm-cable-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Dumbbell Pullover | `dumbbell-pullover` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Half-Kneeling Single-Arm Cable Row | `half-kneeling-single-arm-cable-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Ball-Supported Dumbbell Row | `ball-supported-dumbbell-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Cable Face Pull | `cable-face-pull` | Same movement | 2026-11-11 | [NASM:face-pull][nasm-face-pull] |
| Reverse Pec Deck | `reverse-pec-deck` | No suitable reference | 2026-11-11 | None recorded |
| Bent-Over Dumbbell Reverse Fly | `bent-over-dumbbell-reverse-fly` | No suitable reference | 2026-11-11 | None recorded |
| Cable Reverse Fly | `cable-reverse-fly` | No suitable reference | 2026-11-11 | None recorded |
| Incline Dumbbell Rear Delt Row | `incline-dumbbell-rear-delt-row` | No suitable reference | 2026-11-11 | None recorded |
| TRX Face Pull | `trx-face-pull` | Related only | 2026-11-11 | [NASM:face-pull][nasm-face-pull] |
| TRX Y-T-W | `trx-y-t-w` | No suitable reference | 2026-11-11 | None recorded |
| Ball Prone Y-T-W | `ball-prone-y-t-w` | No suitable reference | 2026-11-11 | None recorded |
| Cable External Rotation | `cable-external-rotation` | No suitable reference | 2026-11-11 | None recorded |
| Dumbbell Shrug | `dumbbell-shrug` | No suitable reference | 2026-11-11 | None recorded |
| Barbell Curl | `barbell-curl` | Same movement | 2026-11-11 | [NASM:curl][nasm-curl] |
| Incline Dumbbell Curl | `incline-dumbbell-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Hammer Curl | `hammer-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Cable Curl | `cable-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Bayesian Cable Curl | `bayesian-cable-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Machine Preacher Curl | `machine-preacher-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Concentration Curl | `concentration-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Zottman Curl | `zottman-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Dumbbell Spider Curl | `dumbbell-spider-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Kettlebell Hammer Curl | `kettlebell-hammer-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| TRX Biceps Curl | `trx-biceps-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Barbell Back Squat | `barbell-back-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Front Squat | `front-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Zercher Squat | `zercher-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Box Squat | `box-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Hack Squat | `hack-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Leg Press | `leg-press` | Same movement | 2026-11-11 | [NASM:leg-press][nasm-leg-press] |
| Smith Machine Squat | `smith-machine-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Goblet Squat | `goblet-squat` | Same movement | 2026-11-11 | [NASM:goblet][nasm-goblet] |
| Double Kettlebell Front Squat | `double-kettlebell-front-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Heel-Elevated Dumbbell Squat | `heel-elevated-dumbbell-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Stability Ball Wall Squat | `stability-ball-wall-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Conventional Deadlift | `conventional-deadlift` | Same movement | 2026-11-11 | [NASM:deadlift][nasm-deadlift] |
| Sumo Deadlift | `sumo-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift] |
| Romanian Deadlift | `romanian-deadlift` | Same movement | 2026-11-11 | [NASM:rdl][nasm-rdl] |
| Dumbbell Romanian Deadlift | `dumbbell-romanian-deadlift` | Same movement | 2026-11-11 | [NASM:db-rdl][nasm-db-rdl] |
| Double Kettlebell Deadlift | `double-kettlebell-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift] |
| Kettlebell Swing | `kettlebell-swing` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics] |
| Good Morning | `good-morning` | Same movement | 2026-11-11 | [NASM:good-morning][nasm-good-morning] |
| Cable Pull-Through | `cable-pull-through` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional] |
| Weighted Back Extension | `weighted-back-extension` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional] |
| Barbell Hip Thrust | `barbell-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| B-Stance Hip Thrust | `b-stance-hip-thrust` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| Dumbbell Hip Thrust | `dumbbell-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Glute Drive Machine | `glute-drive-machine` | No suitable reference | 2026-11-11 | None recorded |
| Single-Leg Hip Thrust | `single-leg-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Stability Ball Single-Leg Bridge | `stability-ball-single-leg-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Cable Glute Kickback | `cable-glute-kickback` | No suitable reference | 2026-11-11 | None recorded |
| Bulgarian Split Squat | `bulgarian-split-squat` | Same movement | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian] |
| Barbell Reverse Lunge | `barbell-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Dumbbell Walking Lunge | `dumbbell-walking-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Front-Foot-Elevated Split Squat | `front-foot-elevated-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Kettlebell Goblet Reverse Lunge | `kettlebell-goblet-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Step-Up | `step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Smith Machine Split Squat | `smith-machine-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Single-Leg Leg Press | `single-leg-leg-press` | Same movement | 2026-11-11 | [NASM:single-press][nasm-single-press] |
| TRX Single-Leg Squat | `trx-single-leg-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Pistol Squat to Bench | `pistol-squat-to-bench` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Skater Squat | `skater-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Single-Leg Romanian Deadlift | `single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| Kettlebell Single-Leg Deadlift | `kettlebell-single-leg-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| Landmine Single-Leg Romanian Deadlift | `landmine-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| Cable Single-Leg Romanian Deadlift | `cable-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| B-Stance Romanian Deadlift | `b-stance-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| High Step-Up | `high-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Lateral Lunge | `lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Cossack Squat | `cossack-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Lateral Step-Up | `lateral-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Landmine Lateral Lunge | `landmine-lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| TRX Lateral Lunge | `trx-lateral-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Curtsy Lunge | `curtsy-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Transverse Lunge | `transverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Skater Bound | `skater-bound` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Lying Leg Curl | `lying-leg-curl` | Same movement | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl] |
| Seated Leg Curl | `seated-leg-curl` | Same movement | 2026-11-11 | [NASM:seated-curl][nasm-seated-curl] |
| Standing Cable Leg Curl | `standing-cable-leg-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| Dumbbell Leg Curl | `dumbbell-leg-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| Stability Ball Hamstring Curl | `stability-ball-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| Single-Leg Ball Hamstring Curl | `single-leg-ball-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| TRX Hamstring Curl | `trx-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| Nordic Curl | `nordic-curl` | No suitable reference | 2026-11-11 | None recorded |
| Glute-Ham Raise | `glute-ham-raise` | No suitable reference | 2026-11-11 | None recorded |
| Leg Extension | `leg-extension` | No suitable reference | 2026-11-11 | None recorded |
| Single-Leg Extension | `single-leg-extension` | No suitable reference | 2026-11-11 | None recorded |
| Sissy Squat | `sissy-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Reverse Nordic | `reverse-nordic` | No suitable reference | 2026-11-11 | None recorded |
| Peterson Step-Up | `peterson-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Hip Adduction Machine | `hip-adduction-machine` | No suitable reference | 2026-11-11 | None recorded |
| Hip Abduction Machine | `hip-abduction-machine` | No suitable reference | 2026-11-11 | None recorded |
| Cable Hip Abduction | `cable-hip-abduction` | No suitable reference | 2026-11-11 | None recorded |
| Cable Hip Adduction | `cable-hip-adduction` | No suitable reference | 2026-11-11 | None recorded |
| Stability Ball Squeeze Bridge | `stability-ball-squeeze-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Side-Lying Hip Abduction | `side-lying-hip-abduction` | No suitable reference | 2026-11-11 | None recorded |
| Standing Calf Raise Machine | `standing-calf-raise-machine` | Related only | 2026-11-11 | [NASM:calf][nasm-calf] |
| Seated Calf Raise | `seated-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf] |
| Leg Press Calf Raise | `leg-press-calf-raise` | Same movement | 2026-11-11 | [NASM:calf][nasm-calf] |
| Single-Leg Dumbbell Calf Raise | `single-leg-dumbbell-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf] |
| Barbell Calf Raise | `barbell-calf-raise` | Related only | 2026-11-11 | [NASM:calf][nasm-calf] |
| Tibialis Raise | `tibialis-raise` | No suitable reference | 2026-11-11 | None recorded |
| Box Step-Up | `box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Lateral Box Step-Up | `lateral-box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Crossover Box Step-Up | `crossover-box-step-up` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Box Step-Up with Knee Drive | `box-step-up-with-knee-drive` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Eccentric Box Step-Down | `eccentric-box-step-down` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Box Bulgarian Split Squat | `box-bulgarian-split-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Feet-on-Box Decline Push-Up | `feet-on-box-decline-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Box Jump | `box-jump` | Same movement | 2026-11-11 | [NASM:box-jump][nasm-box-jump] |
| Seated Box Jump | `seated-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Depth Jump | `depth-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Lateral Box Jump | `lateral-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Single-Leg Box Jump | `single-leg-box-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Broad Jump | `broad-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Squat Jump | `squat-jump` | Same movement | 2026-11-11 | [NASM:squat-jump][nasm-squat-jump] |
| Approach Vertical Jump | `approach-vertical-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Tuck Jump | `tuck-jump` | Same movement | 2026-11-11 | [NASM:tuck-jump][nasm-tuck-jump] |
| Split Squat Jump | `split-squat-jump` | Same movement | 2026-11-11 | [NASM:lunge-jump][nasm-lunge-jump] |
| Lateral Bound | `lateral-bound` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| 180 Degree Rotational Jump | `180-degree-rotational-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Single-Leg Lateral Hop | `single-leg-lateral-hop` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Pogo Hops | `pogo-hops` | No suitable reference | 2026-11-11 | None recorded |
| Dumbbell Jump Squat | `dumbbell-jump-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Side Step Lunge | `side-step-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Side Step Lunge to Balance | `side-step-lunge-to-balance` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Hanging Knee Raise | `hanging-knee-raise` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Band Pull-Apart | `band-pull-apart` | No suitable reference | 2026-11-11 | None recorded |
| Band Face Pull | `band-face-pull` | Related only | 2026-11-11 | [NASM:face-pull][nasm-face-pull] |
| Band-Assisted Archer Pull-Up | `band-assisted-archer-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Kneeling Band Lat Pulldown | `kneeling-band-lat-pulldown` | Related only | 2026-11-11 | [NASM:pulldown][nasm-pulldown] |
| Band Seated Row | `band-seated-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Tube Single-Arm Row | `tube-single-arm-row` | Related only | 2026-11-11 | [NASM:functional][nasm-functional] |
| Anchored Band Chest Press | `anchored-band-chest-press` | Related only | 2026-11-11 | [NASM:bench][nasm-bench], [NASM:machine-press][nasm-machine-press] |
| Banded Push-Up | `banded-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Band Overhead Press | `band-overhead-press` | No suitable reference | 2026-11-11 | None recorded |
| Band Lateral Raise | `band-lateral-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Band Triceps Pushdown | `band-triceps-pushdown` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Band Biceps Curl | `band-biceps-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Band Pallof Press | `band-pallof-press` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Band Woodchop | `band-woodchop` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Mini-Band Lateral Walk | `mini-band-lateral-walk` | No suitable reference | 2026-11-11 | None recorded |
| Mini-Band Monster Walk | `mini-band-monster-walk` | No suitable reference | 2026-11-11 | None recorded |
| Banded Clamshell | `banded-clamshell` | Same movement | 2026-11-11 | [NASM:clamshell][nasm-clamshell] |
| Banded Glute Bridge | `banded-glute-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Band Pull-Through | `band-pull-through` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional] |
| Band Good Morning | `band-good-morning` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional] |
| Prone Band Hamstring Curl | `prone-band-hamstring-curl` | Related only | 2026-11-11 | [NASM:lying-curl][nasm-lying-curl], [NASM:seated-curl][nasm-seated-curl] |
| Battle Rope Alternating Waves | `battle-rope-alternating-waves` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Battle Rope Side-to-Side Waves | `battle-rope-side-to-side-waves` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Battle Rope Rotational Slams | `battle-rope-rotational-slams` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Battle Rope Double Slams | `battle-rope-double-slams` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Battle Rope Lateral Shuffle Waves | `battle-rope-lateral-shuffle-waves` | No suitable reference | 2026-11-11 | None recorded |
| Medicine Ball Slam | `medicine-ball-slam` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Rotational Medicine Ball Slam | `rotational-medicine-ball-slam` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Rotational Scoop Toss | `medicine-ball-rotational-scoop-toss` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Shot Put Throw | `medicine-ball-shot-put-throw` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Chest Pass | `medicine-ball-chest-pass` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Overhead Wall Throw | `medicine-ball-overhead-wall-throw` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Vertical Toss | `medicine-ball-vertical-toss` | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Medicine Ball Russian Twist | `medicine-ball-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist] |
| Medicine Ball V-Up | `medicine-ball-v-up` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Medicine Ball Push-Up | `medicine-ball-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Medicine Ball Lunge with Rotation | `medicine-ball-lunge-with-rotation` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| Medicine Ball Woodchop | `medicine-ball-woodchop` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| BOSU Squat | `bosu-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| BOSU Push-Up | `bosu-push-up` | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| BOSU Mountain Climber | `bosu-mountain-climber` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| BOSU Single-Leg Romanian Deadlift | `bosu-single-leg-romanian-deadlift` | Related only | 2026-11-11 | [NASM:rdl][nasm-rdl], [NASM:db-rdl][nasm-db-rdl] |
| BOSU Lateral Step-Over | `bosu-lateral-step-over` | No suitable reference | 2026-11-11 | None recorded |
| BOSU Reverse Lunge | `bosu-reverse-lunge` | Related only | 2026-11-11 | [NASM:bulgarian][nasm-bulgarian], [NASM:functional][nasm-functional] |
| BOSU Side Plank | `bosu-side-plank` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| BOSU Squat Jump | `bosu-squat-jump` | Related only | 2026-11-11 | [NASM:box-jump][nasm-box-jump], [NASM:squat-jump][nasm-squat-jump] |
| Monkey Bar Traverse | `monkey-bar-traverse` | No suitable reference | 2026-11-11 | None recorded |
| Toes-to-Bar | `toes-to-bar` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Hanging Windshield Wiper | `hanging-windshield-wiper` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Commando Pull-Up | `commando-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Archer Pull-Up | `archer-pull-up` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Plate Front Raise | `plate-front-raise` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Plate Halo | `plate-halo` | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Plate Pinch Carry | `plate-pinch-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Plate Russian Twist | `plate-russian-twist` | Same movement | 2026-11-11 | [NASM:twist][nasm-twist] |
| Turkish Get-Up | `turkish-get-up` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Kettlebell Clean and Press | `kettlebell-clean-and-press` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics] |
| Kettlebell Snatch | `kettlebell-snatch` | Related only | 2026-11-11 | [NASM:kb-ballistics][nasm-kb-ballistics] |
| Smith Machine Hip Thrust | `smith-machine-hip-thrust` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Dumbbell Glute Bridge | `dumbbell-glute-bridge` | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge], [NASM:functional][nasm-functional] |
| Trap Bar Deadlift | `trap-bar-deadlift` | Related only | 2026-11-11 | [NASM:deadlift][nasm-deadlift], [NASM:kb-deadlift][nasm-kb-deadlift] |
| EZ-Bar Curl | `ez-bar-curl` | Related only | 2026-11-11 | [NASM:curl][nasm-curl] |
| Assisted Pull-Up Machine | `assisted-pull-up-machine` | Related only | 2026-11-11 | [NASM:pull-up][nasm-pull-up] |
| Assisted Dip Machine | `assisted-dip-machine` | Related only | 2026-11-11 | [NASM:close-press][nasm-close-press] |
| Sled Push | `sled-push` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Sled Pull | `sled-pull` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Sandbag Bear-Hug Carry | `sandbag-bear-hug-carry` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Sandbag Squat | `sandbag-squat` | Related only | 2026-11-11 | [NASM:goblet][nasm-goblet], [NASM:prisoner][nasm-prisoner] |
| Ab Wheel Rollout | `ab-wheel-rollout` | Related only | 2026-11-11 | [NASM:core][nasm-core] |
| Ankle-Weight Glute Kickback | `ankle-weight-glute-kickback` | No suitable reference | 2026-11-11 | None recorded |
| Ankle-Weight Side-Lying Leg Raise | `ankle-weight-side-lying-leg-raise` | No suitable reference | 2026-11-11 | None recorded |
| Back Extension | `back-extension` | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning], [NASM:functional][nasm-functional] |

## Warm-up and stretch guide associations

These 92 entries retain their exact app lookup names. There are eight same-movement comparisons, 24 related references and 60 without a suitable reference.

| Guide name | Reference coverage | Reviewed | Sources |
| --- | --- | --- | --- |
| A-skips | No suitable reference | 2026-11-11 | None recorded |
| Arm circles | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Band dislocates | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Band pull-aparts | No suitable reference | 2026-11-11 | None recorded |
| Banded lateral walks | Related only | 2026-11-11 | [NASM:clamshell][nasm-clamshell] |
| Lateral band walks | Related only | 2026-11-11 | [NASM:clamshell][nasm-clamshell] |
| Bodyweight squats to a bench | Related only | 2026-11-11 | [NASM:prisoner][nasm-prisoner] |
| Broad jumps | No suitable reference | 2026-11-11 | None recorded |
| Broomstick or towel pass-throughs | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Cat-cow | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Dead hang | No suitable reference | 2026-11-11 | None recorded |
| Downward dog to plank | No suitable reference | 2026-11-11 | None recorded |
| Explosive push-ups | No suitable reference | 2026-11-11 | None recorded |
| Fast bodyweight squats | No suitable reference | 2026-11-11 | None recorded |
| Fast incline push-ups | No suitable reference | 2026-11-11 | None recorded |
| Glute bridges | Same movement | 2026-11-11 | [NASM:bridge][nasm-bridge] |
| Half-kneeling hip flexor stretch with reach | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| High-knee marches | No suitable reference | 2026-11-11 | None recorded |
| Hip circles | No suitable reference | 2026-11-11 | None recorded |
| Hug-yourself twists | No suitable reference | 2026-11-11 | None recorded |
| Inchworms | No suitable reference | 2026-11-11 | None recorded |
| Incline push-ups on a bench | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Incline push-ups | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Lat stretch holding a post | No suitable reference | 2026-11-11 | None recorded |
| Lateral shuffles | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Leg swings, front to back and side to side | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Leg swings, front to back | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Low box jumps | Same movement | 2026-11-11 | [NASM:box-jump][nasm-box-jump] |
| Marching knee lifts | No suitable reference | 2026-11-11 | None recorded |
| Medicine ball chest pass | Related only | 2026-11-11 | [NASM:power][nasm-power] |
| Open books lying on your side | No suitable reference | 2026-11-11 | None recorded |
| Thoracic open books | No suitable reference | 2026-11-11 | None recorded |
| Prone Y-T-W raises | No suitable reference | 2026-11-11 | None recorded |
| Push-up to downward dog | No suitable reference | 2026-11-11 | None recorded |
| Push-ups | Same movement | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Reach-and-pull | No suitable reference | 2026-11-11 | None recorded |
| Reverse arm swings | No suitable reference | 2026-11-11 | None recorded |
| Reverse lunges in place | No suitable reference | 2026-11-11 | None recorded |
| Scap pull-ups | No suitable reference | 2026-11-11 | None recorded |
| Scap push-ups | No suitable reference | 2026-11-11 | None recorded |
| Side lunges | Related only | 2026-11-11 | [NASM:planes][nasm-planes] |
| Bodyweight good mornings | Related only | 2026-11-11 | [NASM:good-morning][nasm-good-morning] |
| Calf raises | No suitable reference | 2026-11-11 | None recorded |
| Deep squat hold | No suitable reference | 2026-11-11 | None recorded |
| Bodyweight squats | Related only | 2026-11-11 | [NASM:prisoner][nasm-prisoner] |
| Quadruped hip circles | No suitable reference | 2026-11-11 | None recorded |
| Bird dogs | Same movement | 2026-11-11 | [NASM:bird][nasm-bird] |
| Dead bugs | Same movement | 2026-11-11 | [NASM:dead-bug][nasm-dead-bug] |
| Plank shoulder taps | No suitable reference | 2026-11-11 | None recorded |
| Spiderman lunge with reach | No suitable reference | 2026-11-11 | None recorded |
| Cossack squats | No suitable reference | 2026-11-11 | None recorded |
| Goblet squat pry | No suitable reference | 2026-11-11 | None recorded |
| Kettlebell halos | No suitable reference | 2026-11-11 | None recorded |
| Band face pulls | Same movement | 2026-11-11 | [NASM:face-pull][nasm-face-pull] |
| Ankle rocks against a wall | No suitable reference | 2026-11-11 | None recorded |
| Hip airplanes | No suitable reference | 2026-11-11 | None recorded |
| Single-leg glute bridges | Related only | 2026-11-11 | [NASM:bridge][nasm-bridge] |
| Quadruped T-spine reach | No suitable reference | 2026-11-11 | None recorded |
| Seated twists | No suitable reference | 2026-11-11 | None recorded |
| Seated twist | No suitable reference | 2026-11-11 | None recorded |
| Shoulder rolls | No suitable reference | 2026-11-11 | None recorded |
| Shoulder taps on the wall | No suitable reference | 2026-11-11 | None recorded |
| Sit-to-stands from a chair | No suitable reference | 2026-11-11 | None recorded |
| Split squat holds | No suitable reference | 2026-11-11 | None recorded |
| Standing back arch and round | No suitable reference | 2026-11-11 | None recorded |
| Standing hip extensions | No suitable reference | 2026-11-11 | None recorded |
| Standing knee hugs | No suitable reference | 2026-11-11 | None recorded |
| Walking knee hugs | No suitable reference | 2026-11-11 | None recorded |
| Thoracic rotations on hands and knees | No suitable reference | 2026-11-11 | None recorded |
| Thread the needle | No suitable reference | 2026-11-11 | None recorded |
| Walking lunges | No suitable reference | 2026-11-11 | None recorded |
| Wall push-ups | Related only | 2026-11-11 | [NASM:push-up][nasm-push-up] |
| Wall sit | No suitable reference | 2026-11-11 | None recorded |
| Wall slides | No suitable reference | 2026-11-11 | None recorded |
| World’s greatest stretch | No suitable reference | 2026-11-11 | None recorded |
| Biceps wall stretch | No suitable reference | 2026-11-11 | None recorded |
| Butterfly stretch | Same movement | 2026-11-11 | [NASM:butterfly][nasm-butterfly] |
| Calf stretch on a wall | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Child’s pose | Same movement | 2026-11-11 | [NASM:child][nasm-child] |
| Cobra stretch | No suitable reference | 2026-11-11 | None recorded |
| Cross-body shoulder stretch | No suitable reference | 2026-11-11 | None recorded |
| Doorway chest stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Figure-4 glute stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Half-kneeling hip flexor stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Hands-behind-back chest opener | No suitable reference | 2026-11-11 | None recorded |
| Kneeling shin stretch | No suitable reference | 2026-11-11 | None recorded |
| Lying cross-body glute stretch | No suitable reference | 2026-11-11 | None recorded |
| Neck side stretch | No suitable reference | 2026-11-11 | None recorded |
| Overhead triceps stretch | No suitable reference | 2026-11-11 | None recorded |
| Seated hamstring stretch | Related only | 2026-11-11 | [NASM:stretching][nasm-stretching] |
| Standing quad stretch | No suitable reference | 2026-11-11 | None recorded |
| Wrist flexor and extensor stretch | No suitable reference | 2026-11-11 | None recorded |

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
