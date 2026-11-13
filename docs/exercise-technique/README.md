# Internal exercise technique notes

Reviewed November 13, 2026, against the catalog on development commit `7b763e9f94aba88b775d3d2644167e73fc57d994`.

This reference covers **all 320 catalog exercises**, **all 92 named warm-up/stretch guides**, and **12 cardio movement types mapped to 67 app labels**. It is for internal research, coaching review and future authoring. The repository is public: internal means outside the member interface, not confidential. These documents and JSON files are not imported, fetched, precached or packaged by the app.

## Read the notes

| Area | Reference |
| --- | --- |
| Chest, shoulder and triceps movements | [Presses](catalog-presses.md) |
| Back, rear shoulder, biceps and pulling movements | [Pulls](catalog-pulls.md) |
| Squats, hinges, lunges, hips and lower-leg movements | [Legs](catalog-legs.md) |
| Rotation, trunk control and loaded carries | [Core and carries](catalog-core-and-carries.md) |
| Jumps, ball throws, kettlebell skills and ropes | [Power and conditioning](catalog-power-and-conditioning.md) |
| Every named preparation/recovery guide | [Warm-ups and stretches](warmups-and-stretches.md) |
| Walking, running, bikes, rower, elliptical, stairs, rope, jacks and boxing | [Cardio and app-label mapping](cardio.md) |
| Exact URLs, review scope, facts checked and source limitations | [Source directory](sources.md) |

Each catalog/guide entry has its own setup, execution, alignment/range, breathing/pace, common mistakes, easier version, variation-specific qualifications and references. Shared movement principles are combined with exercise-specific details. Read the variation details when the support, load, grip or movement intent differs from the source.

Machine-readable equivalents are [catalog.json](catalog.json), [guides.json](guides.json), [cardio.json](cardio.json), [sources.json](sources.json) and [coverage.json](coverage.json). They are reference data, not a new application schema. Catalog IDs match the existing app; guide IDs here are document anchors and are not persistent app IDs.

## What the research establishes

Research included current publisher exercise pages, original coaching articles, manufacturer instructions, clinical exercise descriptions and selected research/manual excerpts. Sources include NASM, ACE, PureGym, Catalyst Athletics, TRX, Physitrack, NHS services, AAOS, NSCA, Concept2 and other identified authors. The 262 source URLs are a reference inventory; they differ in strength and independence. Five references were added in the [TRX setup follow-up](../TRX-ANTI-ROTATION-2026-11-13.md).

| Relationship | Catalog | Warm-up/stretch guides |
| --- | ---: | ---: |
| Same movement | 164 | 41 |
| Related only | 156 | 51 |
| Unresolved exact configuration | 0 | 0 |
| Total | 320 | 92 |

**Same movement** means an inspected written reference describes that movement or a named section matching it. It does not mean that every cue in this independently written synthesis appears in the source, that multiple references agree, or that a professional has approved the entry. **Related only** explicitly preserves the gap when equipment, support, load, direction or sequence is adapted. **Unresolved** identifies an exact setup that could not be established adequately.

The initial **TRX Anti-Rotation Press** setup gap was resolved through a directly inspected coaching article and separate TRX equipment instructions. The [follow-up record](../TRX-ANTI-ROTATION-2026-11-13.md) distinguishes the selected chest-level variation, conflicting foot arrangements, single-handle procedure and excluded overhead progression. No video motion was inspected and no universal strap length or measured lean angle is asserted. Same-movement coverage remains a source relationship, not observed technique approval.

Additional limits remain even where the relationship is not unresolved: the reverse-Nordic paper was available only as an abstract because its manuscript download timed out; some PDF references were available through exercise-specific indexed excerpts; the trap-bar and A-skip videos were not visually inspected; several uncommon variants use related movement evidence. Every source records its scope and limitations. HTTP 200, a recognizable publisher or a matching page title alone did not count as technique verification.

## Conflicts and choices

- PureGym's preacher-curl instructions describe a concentration curl; another machine-preacher reference was used. Its military-press page includes leg drive; that instruction was excluded from the strict overhead press.
- PureGym's incline-dumbbell page includes a barbell-unracking sentence. Its side-step-up page repeats a forward step-up, and its curtsy-lunge page has inconsistent movement text. These issues remain visible in the affected entries.
- NASM's bench-dip muscle list is unrelated to the exercise. Its close-grip machine row mentions a backrest despite a pulling movement. Neither detail was used as an equipment/anatomy instruction.
- LUXIAOJUN describes a shoulder-height Lu raise, while Rehab Hero describes an overhead arc. The catalog's overhead interpretation is explicit; the references are not treated as equivalent.
- Some shoulder guides tell readers to keep the scapulae pinned down/back throughout elevation. The notes allow normal upward rotation, with a separate biomechanics reference, rather than combining contradictory instructions.
- Physitrack's Peterson numbered steps lower the working heel as the knee extends, unlike the app's short heel-stays-up cue; its FAQ describes a different generic step-up. Only its numbered movement section was used. The current knee-hug URL now describes seated movement despite a standing search excerpt; standing/walking notes retain related-only coverage.
- Fixed squat depth, a perfectly vertical lunge shin, knee-height-or-higher step-ups, forced joint lockout, a universal jump-load percentage and an assumed medicine-ball rebound are not treated as universal requirements.

These are internal research findings. Existing user-visible cues and demonstrations were not changed by this work.

## Review and maintenance

All entries are **research drafts**, not professional technique certification or individualized medical/rehabilitation advice. A source's clinical setting does not authorize importing its treatment dosage. No new sets, reps, progression rules, exercise names, access rules or account data are introduced. Coaches should review practical setup, movement interpretation, equipment differences and individual needs before using these notes to direct a person or animate a demonstration. A pain-free-looking description is not a guarantee of safe or pain-free performance for everyone.

The [November 11 NASM audit](../EXERCISE-AUDIT-2026-11-11.md), [original evidence inventory](../exercise-audit-2026-11-11.json) and [source register](../EXERCISE-SOURCES.md) remain intact. Each entry retains its earlier NASM associations separately from the new evidence. Later reviews should add dated findings and preserve the distinction between direct comparisons and adaptations.

Run `node scripts/check-internal-technique.mjs` from the repository root after catalog or reference changes. It checks current catalog/guide coverage, evidence links, historical NASM associations, cardio labels and document anchors. Build both asset packages to check that reference files remain outside the runtime. See the [dated implementation/check record](../EXERCISE-TECHNIQUE-2026-11-13.md) for publication status and verification limits.
