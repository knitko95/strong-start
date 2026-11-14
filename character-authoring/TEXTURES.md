# Texture assets and generation record

The final selected sources are `textures/chestnut-hair-source.png`,
`textures/brown-iris-neutral.png` and `textures/reference-face-uv.png`.
All were generated with the built-in `image_gen` tool on November 13, 2026.
No API/CLI fallback was used. These are actual model texture inputs, not renders
presented as a finished 3D model. Runtime delivery uses their UV-packed WebP atlas.

MakeHuman's CC0 diffuse skin and the existing model's baked UV template remain
the underlying source. The owner's supplied workout mockup was a visual reference
for the facial-color edit; the mockup itself is not redistributed here. The edited
head's main landmarks were compared with the original UV template before use.
Standard UV packing, linear skin-color matching, opaque scalp filling, alpha-edge
RGB dilation and WebP encoding are implemented in the authoring scripts. Hair
alpha is retained; the RGB dilation avoids pale mipmap fringes.

## Hair atlas prompt

Use case: photorealistic-natural. Asset type: technical hair-card texture atlas
for a mobile 3D female character. Generate ONLY a square 1024x1024 texture atlas
with a genuinely transparent background, not a picture of a person or a hairstyle.
Eight distinct narrow vertical strips of natural medium chestnut brunette hair
arranged evenly side by side with clear transparent gutters. Every strip starts
with a dense straight root at its top and ends in irregular wispy individually
separated tapered tips near its bottom. The hair is long and gently flowing
vertically, not tightly curled. Include fine realistic individual hair fibers,
subtle warm brown and muted chestnut variation, with darker roots and soft
low-contrast natural highlights. Fibers must stay vertical and each strip must
be separate so it can be mapped onto a single elongated 3D ribbon. Dense soft
clumps through the upper 70 percent, increasingly sparse flyaway fibers at the
tips. Flat unlit albedo appropriate for physically based 3D rendering; no strong
directional lighting, no shadows cast on a background, no baked glossy white
specular streaks. No scalp, head, face, skin, accessories, hands, labels, words,
grid lines, borders, watermark, or checkerboard. This texture will make a
realistic loosely tied-back brunette fitness instructor hairstyle.

## Initial iris prompt

Use case: scientific-educational. Asset type: single unlit PBR iris albedo
texture for the eyes of a realistic mobile 3D adult female character. A perfectly
centered, perfectly circular natural warm medium brown human iris filling 90
percent of a square image, straight-on orthographic view, surrounded by pure
white outside the circle. The round black pupil is centered and its diameter is
34 percent of the iris diameter. Realistic fine radial fibers and crypts with
restrained warm chestnut, brown and tiny muted amber flecks, dark natural limbal
ring, no dramatic gold or green. Flat diffuse texture, even neutral lighting
with NO catchlight, NO reflected window, NO glossy white streak, NO shadows, NO
camera perspective. No eyelids, eyelashes, skin, face, labels, text or watermark.
The 3D renderer will add the corneal shine and lighting. Technical texture,
anatomically plausible adult human eye.

## Final neutral iris edit

Input: the generated initial iris (the warmer intermediate is retained locally).
Edit only the iris pigmentation in this technical 3D eye texture. Keep the exact
circular iris silhouette, centered black pupil, fine radial fiber structure,
white exterior, and absence of catchlights. Change the orange/red/amber pigment
to a subdued neutral DARK BROWN human iris with muted taupe-brown detail, like a
natural brunette adult woman's brown eyes. Much lower red/orange saturation,
darker overall by about one stop, subtle grey-brown fibers. The pupil stays pure
black. No added reflections, eyelids, skin, text, lighting gradients or new
elements. Preserve the technical unlit albedo texture layout exactly.

## Facial albedo edit

Use case: precise-object-edit. Image 1 is an EDIT TARGET: an existing unwrapped
UV albedo texture for a real 3D female head. Image 2 is a STYLE REFERENCE: the
adult brunette fitness woman in the center phone mockup. Edit only the skin and
facial coloring on the main large head island of image 1 to give this adult 3D
character a realistic, healthy, warm light-olive complexion and subtle natural
facial definition inspired by the reference woman. Refine skin color detail,
soft warm cheeks, natural rose lips, and subtle eye/brow detail; avoid the sparse
ruddy scalp speckling and overly pale mannequin appearance. CRITICAL TECHNICAL
INVARIANTS: preserve image 1's EXACT UV layout, silhouette, black background,
island boundaries, resolution, orientation and landmark pixel locations. The
unwrapped face is sideways with its nose pointing RIGHT: keep it sideways. Do
NOT rotate it into an upright portrait. Eyes, nose, mouth and ears must remain
at precisely their original positions and sizes so they still match the 3D mesh.
Do not turn this into a rendered face or a photo portrait. Preserve the other
small hand/mouth/skin islands unchanged. No hair, eyelashes protruding from the
map, new geometry, text, watermark, baked directional shadows, strong specular
highlights or accessories. This is a diffuse color UV texture to be applied to
existing geometry, not a final illustration. Keep the natural pore detail fine
and unobtrusive, with photoreal skin color variation suitable for mobile rendering.
