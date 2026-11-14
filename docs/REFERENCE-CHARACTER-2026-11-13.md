# Reference-based character pass — November 13, 2026

This development draft follows the requested realistic adult fitness reference
more closely, including the subsequent request for a larger covered bust. It
keeps the existing 55-bone runtime skeleton, hierarchy, inverse binds, animations,
equipment and account behavior. The original anatomical instructor remains the
default; choose Rose athlete in the demonstration gallery or open the
[Character studio](https://dev.strongstart.app/exercise-guides/character-lab.html).

The head now retains more geometry around the eyelids and facial silhouette.
Reference-directed skin color detail, natural brows and neutral-brown iris fibers
replace the previous plain surface/solid brow treatment. Head texture space is
allocated separately inside the atlas. The loosely swept brunette hair uses
overlapping textured ribbons and a solid textured underlayer, with finer framing
pieces and a gathered bun. All hair remains attached to the existing head bone;
there are no particles, simulations or added bones. Eye, skin, fabric and hair
shine differ through one small linear roughness map.

The bust change is a smooth paired surface adjustment beneath the existing
workout top, with no skeletal or limb-length change. The maximum source rest
projection is approximately 22 mm before the existing scene scale. The clothing
color remains bound to the skin UVs during movement. Sampled exercise contacts
and deformation still require owner review; this is not professional technique
or exhaustive collision approval.

## Mobile budget and checks

- 30,146 vertices, 56,112 triangles, up to four weights per vertex, one skinned
  draw for the character. Equipment adds its own draws.
- Geometry: 1,073,976 bytes; 2048px RGBA WebP atlas: 784,190 bytes; 512px scalar
  roughness PNG: 15,088 bytes. Total: 1,873,254 bytes, about 1.9 MB.
- Nominal RGBA8 texture storage with mipmaps is about 23.8 MB, excluding driver,
  scene, framebuffer and environment allocations. Decoded geometry is 2.36 MB.
- The original anatomical body and its role textures are not downloaded for a
  fresh Rose-athlete-only visit. Fitted geometry caching remains bounded to two
  bind frames. The character has no muscle-highlight overlay.
- 36 WebGL comparison cases (12 exercises at 1000/390/320 px) preserve paused
  time, skeleton/body identity, and all bone/equipment matrices exactly; sampled
  skin coordinates remain finite. Playback, half speed, reduced motion, cached
  offline switching, layout and console checks pass.
- A separate 390 × 844, DPR-3 desktop Chrome proxy, including 4× CPU slowdown,
  samples goblet squat, bench press and shoulder press for 120 frames each.
  Observed median intervals are about 13.3 ms and 95th-percentile intervals about
  13.4–13.5 ms on this computer. These are animation-frame intervals, not GPU
  timer-query measurements or physical-phone results.

Appearance and resemblance remain subjective and this remains a draft. A
physical-phone test is still needed for device-specific GPU behavior, thermal
limits, battery use and sustained performance. No database migrations or
production configuration changes are part of this work.

Editable source and reproduction: [character authoring](../character-authoring/README.md).
Texture generation and prompt records: [texture sources](../character-authoring/TEXTURES.md).
