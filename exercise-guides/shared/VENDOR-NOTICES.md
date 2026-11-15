# Runtime libraries

Vendored from pinned npm package distributions:

- Three.js **0.180.0** — https://www.npmjs.com/package/three/v/0.180.0 — MIT; `vendor/LICENSE.three`. Includes core/module builds, OrbitControls and RoomEnvironment.
- meshoptimizer **0.25.0** — https://www.npmjs.com/package/meshoptimizer/v/0.25.0 — MIT; `vendor/LICENSE.md`. Runtime uses the decoder; the encoder is used by the build script.
- fflate **0.8.2** — https://www.npmjs.com/package/fflate/v/0.8.2 — MIT; `vendor/LICENSE.fflate`. Used when native gzip decompression is unavailable.

Character and anatomical source notices remain linked in the preview footer and retained in the original prototype/source folders. This package rearranges and compresses existing adapted assets; it does not change their license or remove attribution obligations. Include the existing full notices when publishing a standalone runtime package.
