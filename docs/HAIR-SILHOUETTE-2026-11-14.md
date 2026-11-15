# Softer hair and fuller covered bust — November 14, 2026

The Rose athlete development candidate now has a smooth fitted hairline, finer
overlapping crown layers, loose face-framing strands, baby hairs and irregular
bun flyaways. Fourteen narrow modelled filaments supplement the alpha-tested
cards so a few continuous strands survive texture mipmapping. All use the
existing head bone, shared material and atlas; there is no hair simulation.
The opaque underlayer remains to avoid scalp holes. This is still a game-style
draft and does not reproduce the supplied reference's photographic realism.

Blender MCP was used to inspect the actual source model, create an adjustable
covered-bust shape key and add the initial loose-strand geometry in a separate
candidate scene. The original open startup scene was retained. The reproducible
authoring scripts apply the same surface field before reduction and package the
final neutral source with its textures embedded. Local editable files are
`output/realistic-character-review-v3/rose-athlete-mcp-edit.blend` (adjustable MCP
draft) and `rose-athlete-final.blend` in that directory (final packed candidate).

The bust has an additional smooth 16 mm surface adjustment over the previous
draft, including a small width increase beneath the fitted workout top. Maximum
total projection from the original source is 37.64 mm before the existing scene
scale; this is a mesh measurement, not a clothing size. Bone hierarchy, joint
frames, skin weights, animation tracks and equipment are retained. Sampled
squat, bench-press and supported-row views were inspected; exhaustive contact
or professional movement approval is not established.

The strand atlas contains dense and sparse columns. RGB edge dilation retains
the generated alpha. Hair roughness increased from 0.66 to 0.78. Alpha-to-coverage
was disabled after an app-renderer comparison showed bright broken outlines
along overlapping cards; ordinary alpha testing remains enabled at 0.28.

## Final asset budget

| Item | Budget |
| --- | ---: |
| Vertices / triangles | 32,353 / 58,704 |
| Skin influences / rig bones | 4 / 55 |
| Character draws | 1 |
| Compressed geometry | 1,113,036 bytes |
| 2048px RGBA WebP atlas | 761,002 bytes |
| 512px linear roughness PNG | 15,111 bytes |
| Total runtime download | 1,889,149 bytes |
| Decoded geometry | 2,516,216 bytes |

The download grew by 15,895 bytes (under 1%) from the previous candidate. Nominal
RGBA8 texture storage including mipmaps remains about 23.8 MB; framebuffer,
environment and driver allocations are additional. Equipment adds its own draws.
The 35,000-vertex and 60,000-triangle limits remain enforced by package checks.

Physical-phone GPU, thermal, battery and sustained-performance checks remain
open. The original anatomical instructor remains the default; selecting Rose
athlete does not change account or workout data. No database migration or
production configuration change is included.

## Verification

The final candidate passes static geometry/index/weight checks and all 36 WebGL
comparison cases (12 exercises at 1000/390/320 px). Model switching retains the
same skeleton/body identities, paused time and every bone/equipment matrix
exactly (maximum delta 0). Playback, half speed, reduced motion, cached offline
switching, finite sampled skin coordinates, overflow and error checks pass.
All 446 existing exercise WebGL cases pass, including three sampled poses,
controls, storage/decompression fallback, retry and unchanged synthetic app state.
The dev build also passes 103 app/persistence and six offline scenarios.

A desktop Chrome proxy at 390 × 844, DPR 3, with 1× and 4× CPU settings sampled
120 frames for squat, bench press and shoulder press. Median frame intervals
were about 8.3 ms and p95 about 8.4–8.5 ms on this session's 120 Hz desktop.
These are refresh-bound frame intervals, not GPU timer measurements or proof of
performance on a phone. They must not be compared directly with the earlier
75 Hz session's 13.3 ms intervals as a rendering-speed improvement.

Reproduction and evidence: [authoring instructions](../character-authoring/README.md),
[texture inputs and exact prompts](../character-authoring/TEXTURES.md), and the
[earlier reference pass](REFERENCE-CHARACTER-2026-11-13.md).
