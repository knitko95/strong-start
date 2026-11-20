# Exercise focus audit and catalog fixes (2026-11-18)

Reviewed by Claude with the owner, November 18, 2026. Scope: 214 strength exercises in the chest, shoulder, upper back, back, quad, glute, hamstring, inner/outer thigh and calf slots. Not reviewed: core, rotation, carries, arms, jumps. This is a working classification from general exercise-science knowledge, not a sourced audit or professional certification; no new third-party references were added to the [source register](EXERCISE-SOURCES.md).

## Purpose

Each exercise was sorted into a group made of its **movement type** and the **part of the muscle it focuses on** (for example Flat press / middle chest, Incline press / upper chest, Hip hinge / hamstrings from the hip, Leg curl / hamstrings from the knee, straight-knee vs bent-knee calf raise). The planned similar-move warning will use these groups: two exercises from the same group in one workout get a dismissible note; different groups, or the same group on different days, never do. The warning itself is not built yet.

## Catalog fixes applied on dev (owner-approved)

| Change | Why |
| --- | --- |
| Dumbbell Shrug moves from the rear-delt slot to a new `traps` slot (traps main, forearms supporting) | It was counted as rear-delt work on the muscle map and could fill a plan's rear-delt spot. |
| Dumbbell/Plate Front Raise, Kettlebell/Plate Halo and Battle Rope Alternating Waves move from `shoulder_iso` to a new `shoulder_aux` slot that plans don't fill | The side-delt spot could pick a move that gives side delts nothing. Halos are now described as shoulder mobility. All stay in the Library and the swap picker. |
| Vertical press slot: front delts main; side delts, triceps and traps supporting. Overhead press descriptions now start "Front delts, side delts" | Overhead pressing is mostly front delts. |
| Lateral Lunge renamed **Side Lunge** (ID `lateral-lunge` kept); Side Step Lunge removed as a duplicate (`side-step-lunge` resolves to Side Lunge) | Owner decision. Lateral Step-Up / Lateral Box Step-Up and Step-Up / Box Step-Up stay (different equipment). |
| Wording: Squeeze Press "Chest, triceps"; Weighted Dip "Lower chest, triceps"; Assisted Dip Machine "Triceps, lower chest"; Peterson Step-Up "Quads, knee control"; Box Step-Up with Knee Drive "Quads, glutes, balance"; rows use "Upper back" instead of "Mid back" | Accuracy and consistency. |

Existing plans: once per program, in the person's own app with no workout in progress, `repairCatalogPicks()` moves `side-step-lunge` picks, adjustments and saved weights to `lateral-lunge`, and re-picks **app-chosen** slots whose exercise no longer belongs to that slot (closest similar candidate). The person's own swaps are kept; coach previews change nothing. New programs are marked as already repaired. The hosted pose-review catalogue, animation manifest and recipe use the new Side Lunge name; the Side Step Lunge animation asset is retained.
