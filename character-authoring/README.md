# Character comparison candidate

The development gallery has a Character selector. The separate
[`character-lab.html`](../exercise-guides/character-lab.html) page opens the Rose
athlete draft directly and uses the same application renderer and exercise assets.
Selection lasts for that page session; no profile, plan or account data changes.
The anatomical instructor remains the default in a fresh application session.

The candidate has 25,471 vertices, 48,296 triangles, four influences per vertex,
one skinned draw, one 1024 × 1024 color atlas, and no hair simulation. Geometry
and texture total 1,623,372 bytes. This is an asset budget, not a measured mobile
frame rate. Existing exercise equipment adds its own draws. The original body is
loaded only when selected. At most two candidate bind fits are retained.

The accepted 55-bone hierarchy, motion packs, inverse binds, equipment and muscle
maps are unchanged. The mesh is fitted once into each accepted bind frame using
its source inverse binds; animations are not retargeted or regenerated. All 53
common source bones are checked against the accepted rest frames. The editable
scene also retains the accepted two forearm helpers. Hair, eyes and trainers use
the existing head/foot bones. Clothing is a baked fitted surface, not simulated
cloth. The anatomical model's muscle texture is not projected onto this model.

The local build uses Blender 5.3 and the existing source scenes. From the app root:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' -b --python-exit-code 1 --python character-authoring/build_candidate.py -- 'C:/Passion/Strong Start' 'C:/Passion/Strong Start/output/realistic-character-review'
python character-authoring/package_candidate.py 'C:/Passion/Strong Start/output/realistic-character-review'
node scripts/check-all-exercise-animations.mjs --prune
node scripts/build-dev.mjs
node scripts/test-character-models.cjs http://127.0.0.1:8742/exercise-guides/character-lab.html
```

The source root must contain the original female goblet-squat scene and accepted
anatomical goblet-squat scene under `output/`; these are local authoring inputs,
not runtime dependencies. The review directory needs `skin-source.png`, from
[MakeHuman's base texture mirror](https://download.tuxfamily.org/makehuman/assets/1.1/base/skins/textures/young_lightskinned_female_diffuse.png).
The [official system assets register](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)
records the CC0 graphical assets. Runtime attribution and distinctions from the
separate anatomical model are in
[`CHARACTER-NOTICES.html`](../exercise-guides/shared/CHARACTER-NOTICES.html).
`rose-athlete.blend` is the self-contained editable output, with the color map
packed. The runtime uses `characters.json` and two content-addressed assets.

Verification covers 12 representative movements at 1000, 390 and 320 pixels,
model switching with identical bone/equipment matrices and paused time, finite
sampled skin positions, lazy loading, play/pause, half speed, reduced motion,
cached offline switching and no horizontal overflow or unexpected browser errors.
Front/back/side and press/support screenshots are retained locally. This is a
first realistic-style character draft; it does not reproduce the reference's
photorealism. Body/equipment fit and contacts require visual review. Physical
phones, low-end performance and professional movement review remain unverified.
