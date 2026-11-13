# Character comparison — November 13, 2026

The test application offers a reversible character comparison in its existing
3D demonstration gallery. The anatomical instructor remains the default; the
new Rose athlete is a visual draft. A separate
[Character studio](https://dev.strongstart.app/exercise-guides/character-lab.html)
opens that candidate directly with the same renderer, motion and equipment.
Model selection preserves paused time and the camera. It lasts for the page
session and is not a saved profile setting.

The female MakeHuman base is adapted with a natural skin texture, rose fitted
training top, dark leggings, pulled-back chestnut hair and ivory trainers.
The candidate uses the existing 55-bone runtime rig. Source-to-accepted bind
fitting adapts mesh rest coordinates rather than changing the animations.
Existing anatomical body data, role maps, exercise motion and equipment remain
unchanged. Muscle highlighting stays on the anatomical instructor.

The candidate contains 24,936 vertices and 47,264 triangles, one 1024px atlas,
four weights per vertex and one skinned draw. Compressed geometry plus texture
is 1,600,435 bytes. The anatomical body is loaded lazily if selected; fitted
candidate geometries are bounded to two cached bind frames. Package size is
not a physical-phone performance measurement.

Local WebGL checks cover 36 exercise/viewport combinations (12 representative
movements at desktop, 390px and 320px), identical bone/equipment matrices and
paused time when switching, stable body/skeleton identities, finite sampled
skin coordinates, playback, half speed, reduced motion, cached offline model
switching and no horizontal overflow or unexpected browser errors. Main app
build, syntax, environment, persistence/workout, ownership and offline checks
also pass. Front/back/side, pressing and supported-row screenshots were inspected.
The existing full-library WebGL regression also passes all 445 exercises at
three poses, phone/desktop controls, retry/storage/decompression fallback and
unchanged synthetic app state. The new candidate's visual checks remain the
12 representative movements above, rather than every library contact/frame.

This is a first realistic-style draft, not the reference's photorealism. Contact
fit, appearance approval, physical phones, low-end performance and professional
exercise review remain open. No database migrations or configuration changes.
Production publication requires approval of a defined tested release.

See [the authoring notes](../character-authoring/README.md) for source provenance,
reproduction, asset format and local editable Blender output.
