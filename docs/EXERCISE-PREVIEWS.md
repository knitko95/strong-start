# Exercise preview stills

Today uses static 88px previews from the approved public pose catalogue on development.
Tapping a preview opens the existing exercise instructions/demonstration. The list does
not animate or load the 3D player. Exercises without approved stills, unavailable files
or valid preview metadata retain a neutral demonstration button.

Each catalogue exercise has an explicit `preview.frame` (zero-based). Choose the pose
that best identifies the movement at thumbnail size: visible working position, clear
body shape and identifiable equipment. Prefer the distinctive working position over
a generic upright setup; do not choose an arbitrary animation timestamp. Frame choices
are authored alongside the approved pair and remain fixed through reloads and swaps.
The four approved mockup selections are Goblet Squat frame 1, Barbell Bench Press frame
0, Dumbbell Overhead Triceps Extension frame 0 and Dead Bug frame 0.

`preview.bounds` stores `[left, top, right, bottom]` pixel bounds of the selected still's
visible person **and equipment**. Run `python scripts/update-pose-preview-bounds.py`
after changing the selected frame or artwork (authoring requires Pillow). It calculates
the alpha bounds using a threshold of 32, without modifying the original artwork.
The UI centers those bounds inside a square with a side 1.1 times their longest edge,
leaving a small, consistent margin. It preserves aspect ratio, the complete person and
equipment, and the 88px tile size. The full demonstration retains its original framing.

Before adding/replacing approved art, review the selected frame and framing at 88px on
a narrow phone layout; metadata validation alone does not establish visual quality or
exercise technique. The Node build checks explicit frame selection, valid bounds,
existing exercise IDs, approved environment, image dimensions/bytes/hashes and loader
syntax. Image failure leaves the exercise name, targets, Swap and instructions usable.
Only the expanded Today plan requests its thumbnails, with a bounded decoded-image cache.
Preview metadata is public media configuration, never member plan or account state.
