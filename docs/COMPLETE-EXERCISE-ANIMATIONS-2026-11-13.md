# Complete exercise demonstration drafts — November 13, 2026

The owner requested animations and supporting equipment for every remaining
exercise, reusing the optimized shared character and reviewing the finished set
inside the application afterwards. This authorizes the development deployment;
production publication remains a separate release decision.

The development catalogue now contains 445 demonstrations: all 320 strength
exercises, 91 additional unique IDs covering all 92 named warm-up/stretch guides
(one guide already shares a strength ID), 15 cardio demonstrations, 18 named
foam-roller/massage-ball variants, and the retained original squat reference.
Seventeen strength clips plus that squat were already authored; 427 clips are new.
New clips are explicitly marked as awaiting owner review. Earlier reviews are
retained without claiming professional anatomical/technique approval.

The same accepted character payload, skeleton, topology, bind fits and eighteen
previous scene assets remain unchanged. New animations use small compressed
motion packs and a common rig setup. Five reusable primitive geometries provide
new equipment, with the earlier dumbbells and equipment geometry reused. Benches,
bars, plates, cable/machine frames, kettlebells, balls/BOSU, suspension straps,
bands, boxes, ropes, sled, sandbag, ab wheel, cuffs and recovery props are assembled
from shared components. Cable, rope and moving equipment channels accompany the
body motion. Role combinations share their maps; no complete body is exported
for each exercise. Numerical byte totals are in the generated package report.

The renderer persists across exercise changes, how-to sheets, workout/rest demos
and the review gallery. It reuses its character and skeleton, caches hashed
public assets on demand, bounds decoded role maps, and stops rendering while
detached. Workout coverage and visibility pause playback without changing saved
training data. Errors retain written instructions. The production environment
gate remains closed for this candidate. No database, account permission, saved
schema or storage-key change is included.

In **Library**, use **Review all 3D demonstrations** to search the complete set,
pause, scrub, slow playback, inspect different angles and toggle muscle colors.
Each strength how-to and swap preview also opens its matching demo. Guided
warm-up/cool-down how-to sheets resolve named movements, cardio labels, ramp-up
strength sets and named recovery areas to their corresponding demonstration.

Validation covers catalogue coverage, all dependency hashes, compressed arrays,
timing, finite normalized quaternions, unchanged character/original clips, fixed
bone lengths and authored foot targets. Real headless Chrome loads every entry
with the actual WebGL renderer at phone width, samples three poses per entry,
checks shared body/skeleton identity and unchanged synthetic account/workout
state, and checks selected views at 320/1280px. All movement-family screenshots
are inspected. Lifecycle checks cover ordinary workout instructions, lending the
renderer to a swap detail, restoration of the workout/pause preference, rapid
selection, expansion, offline cached selection and protected-character reuse on
warm reload. Storage denial, the bundled decompressor and retry after an initial
library-download failure pass with written instructions retained.

Local validation passes: 100 workout/persistence scenarios, six offline-shell
scenarios, all 445 real WebGL entries (1,335 sampled poses), 114 movement-family
screenshots and selected 320/1280px views. The 427 new clips include 42,803
authored pose samples, unchanged bone lengths (maximum numerical drift below
2e-15 metres) and exact authored ankle targets. These measurements check the
rig/targets; they do not certify skin contact or exercise technique. At sampled
animation frames, the browser's selected joint positions differ from the source
recipes by at most 0.986 mm after curve reduction and float encoding.

Reachable public animation assets total **21,871,275 bytes** across 1,127 files,
including the unchanged **5,610,566-byte** character and both accepted bind fits.
Individual motion packs range from 200 to 49,108 bytes; aliases with identical
buffers share URLs. These figures exclude the renderer, licenses, older rose-top
fallback assets and authoring/evidence files. They are stored package sizes,
not measured mobile transfer times. The full library is never prefetched.

Hosted deployment and exact-build checks are recorded below once complete.

Movement recipes are editable in [the authoring folder](../animation-authoring/README.md).
They are catalogue-based draft illustrations; the existing external exercise
source register remains authoritative about which movements have individual
reference support. No new comprehensive external exercise audit is claimed.
Physical-phone performance, authenticated real-account journeys and professional
coaching/anatomy validation remain unverified. Owner review and correction of
the new demonstrations are expected before any production release.
