# Complete exercise animation authoring

The application uses the accepted shared character, both accepted bind fits and
the 55-bone skeleton without re-exporting, sculpting or compressing the body.
The eighteen earlier clips and maps are unchanged. New clips are editable motion
recipes in `recipes.mjs` and `poses.mjs`; reusable equipment is in `equipment.mjs`.
The generated `recipes.json` records every exercise, its catalogue cue, roles,
equipment and review status. These are draft demonstrations for owner review.

The [November 13 correction record](../docs/exercise-animation-audit/corrections.md)
maps the reference-supported form/equipment findings to the revised drafts.
`corrections.mjs` supplies fitted pose/contact targets and
`equipment-corrections.mjs` supplies the corresponding mechanisms. Run
`node scripts/test-animation-corrections.mjs` before rebuilding those assets.
The library now includes a distinct linked-handle air bike (446 clips total).

From the repository root:

```powershell
node animation-authoring/build.mjs --prepare
python animation-authoring/roles.py
node animation-authoring/build.mjs
node scripts/check-all-exercise-animations.mjs --prune
node scripts/build-dev.mjs
node scripts/test-all-exercise-animations.cjs
```

For a motion/equipment edit with unchanged roles, only the last four commands
are needed. The Python role-map step requires NumPy and Pillow. `region-fields.npz`
retains the existing anatomical territory fields and UV triangles; it is not
another runtime character. Maps are 1024px, content-addressed and shared by
identical role combinations. Cached UV rasterization is a disposable local file.

`accepted-setups.json`, `accepted-manifest.json` and `accepted-library.json`
freeze the earlier authored package. Original character/equipment assets remain
in the public shared package; original Blender scenes stay in the earlier local
prototype folders. `export-region-fields.py` documents the one-time extraction
from those earlier sources. Routine motion edits never run Blender or that step.

Each new scene references one shared rig setup, one compressed motion pack,
one existing/new role map and content-addressed equipment geometry. Its sampled
curves include equipment, release trajectories and flexible cable/rope segments.
Identical motion buffers share one hashed URL, including name aliases. Key
reduction retains translation error within 0.12 mm per local channel and
rotation error within 0.0007 radians at sampled poses. Constant curves collapse
to endpoints; unchanged rest curves are omitted. Bone lengths are never scaled.

The checker verifies all 320 strength IDs, all 92 named guide entries, all asset
hashes/sizes, dependencies, animation arrays, timing and quaternion normalization.
It also ensures the character and earlier eighteen scene references are unchanged.
`--prune` removes only unreferenced generated files inside this package's assets
folder after validating that every reachable asset exists and passes its hash.

Current authoring, byte counts and contact measurements are in `build-checks.json`
and `package-report.json`. Browser evidence is generated locally under
`output/animation-verification/`. Numerical checks and browser playback do not
establish professional technique/anatomy approval or physical-phone performance.

See `exercise-guides/shared/NOTICES.html` and its full upstream notice. The adapted
character/muscle illustrations retain the existing CC BY-SA attribution; the
original MakeHuman graphical assets are CC0. New procedural motion/equipment
code is included in this repository. No third-party exercise videos are copied.
