# Loose bun and supported bust — November 14, 2026

This development draft replaces the previous broad hair panels with an adapted
authored bun and strand texture, plus twelve small alpha-tapered flyaways around
the face and bun. The visible bun is smaller and asymmetric; its tie uses the
source's brown strand tile. No simulated hair, new bones, extra material draw or
animation retargeting is introduced. The body keeps its prior reduction ratio;
head and fitted-chest geometry are protected during simplification.

The main hair is adapted from Rehman Polanski's
`rehmanpolanski_hair_bun_brown`, listed as CC0 in the official
[MakeHuman Hair 01 register](https://static.makehumancommunity.org/assets/assetpacks/hair01.html).
The unchanged source files, legacy exporter headers and current release
provenance are retained in [the source record](../character-authoring/assets/bun-brown/PROVENANCE.md).
The existing generated sparse strand texture supplies only the added flyaways.
There was no new image-generation call in this revision.

## Shape references and Blender work

The original workout mockup remains the visual direction. Additional study used
the [Hot Pepper salon hairstyle photo](https://beauty.hotpepper.jp/magazine/803587/)
for loose layering and face-framing curves, and the front/back/side fit photos on
page 3 of [Bravolution's Panache fit reference](https://static1.squarespace.com/static/592fe6e19de4bb40112073a9/t/5a1b94d69140b7c3063c45e8/1511757015197/Braport%2BCard_Panache%2BUnderwire.pdf).
[Panache's product imagery](https://us.panache-lingerie.com/shop/product/non-wired-sports-bra-black)
was also consulted. These photographs are visual references only; no reference
pixels, third-party model likeness or branded clothing design are copied into
the body or clothing texture. Reference downloads remain local review inputs.

The bust is a broad rounded surface beneath the athletic top, with fuller upper
and lateral volume, a softer lower transition, and a smooth fabric bridge across
the centre. The earlier narrow forward-projection fields are removed. The
maximum change from the original source is 46.39 mm forward and 16.25 mm inward,
before the existing scene scale. These are mesh measurements, not a bra size or
anatomical validation. This remains an artistic approximation of a supported
clothed figure; physical breast/cloth dynamics are not simulated.

Blender MCP was used to create and revise an adjustable bust shape key, replace
the actual candidate hair, inspect the accepted rig, and retain the earlier
scenes. The local editable sculpt is
`output/realistic-character-review-v4/rose-athlete-mcp-sculpt.blend`. The final
neutral source with the shared atlas embedded is `rose-athlete-final.blend` in
the same directory. `supported_bust.py` and `authored_bun.py` reproduce the edits;
`reference_head.py` now contains the unchanged facial sculpt and shared utilities.

## Runtime budget

| Item | Final candidate |
| --- | ---: |
| Vertices / triangles | 28,824 / 54,248 |
| Bone count / maximum influences | 55 / 4 |
| Character draws | 1 |
| Compressed geometry | 1,052,965 bytes |
| 2048px RGBA WebP atlas | 506,682 bytes |
| 512px linear roughness PNG | 15,248 bytes |
| Total runtime download | 1,574,895 bytes |
| Decoded geometry | 2,265,120 bytes |

The runtime download is about 16.6% smaller than the previous candidate. Nominal
texture storage including mipmaps stays about 23.8 MB; driver, framebuffer,
environment and other scene allocations are additional. Equipment has its own
draws. The anatomical instructor remains the default and is loaded lazily when
selected; the candidate has no muscle-highlight overlay.

The package continues to enforce 35,000 vertices, 60,000 triangles, valid indices,
finite arrays and normalized weights. Visual review includes squat, press and
chest-supported-row samples; exhaustive contacts and professional technique
review are not established. Physical-phone GPU, thermal, battery and sustained
performance remain unverified. No database, account or production configuration
change is included.

## Verification and limits

All 36 model comparisons (12 movements at 1000/390/320 px) retain paused time,
body/skeleton identity and every bone/equipment matrix exactly (maximum delta
0). Playback, half speed, reduced motion, cached offline switching, finite skin
samples, overflow and browser-error checks pass. All 446 package entries and
their unchanged shared anatomical/motion assets pass static/hash validation.
The integrated dev build passes 103 app/persistence and six offline scenarios.

Phone-size desktop Chrome uses Intel UHD graphics, a 390 × 844 viewport and DPR
3 (renderer capped at 2). Sampling now waits for queued asset-cache writes and
warm-up before measuring steady playback. The six 120-frame samples had median
intervals about 8.3–8.4 ms; the 4× CPU samples had p95 intervals about 16.7–25 ms,
with occasional longer outliers. Earlier load/cache-writing samples had larger
spikes, so these are not cold-start measurements or a frame-rate guarantee.

A separate interleaved 4× CPU comparison of the previous and current model,
with cache writes settled, produced overlapping timing ranges: previous median
8.4–25 ms / p95 24.6–41.7 ms, current median 8.4–16.8 ms / p95 24.6–41.8 ms.
This did not show a consistent slowdown in these trials; it does not prove
physical-phone GPU, thermal, battery or sustained-performance parity.
