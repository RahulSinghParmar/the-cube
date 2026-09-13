# M3: beginner learning and verified 3×3 solving

The owner authorized M3 after the homepage refinement. The original touch
homepage, settings, trophy, M1 timer and M2 practice data remain in place.

## Solver foundation

The canonical representation remains URFDLB-v1. Face grids are viewed from
outside each face, row by row. Centers are fixed to U/R/F/D/L/B. The manual
validator checks 54 allowed stickers, nine of each color, fixed centers, every
edge and handed corner exactly once, corner twist sum, edge flip sum and matching
corner/edge permutation parity. Color counts alone are not a legality proof.
See the [cubie convention](https://kociemba.org/math/cubielevel.htm).

The engine is cubejs 1.3.2, implementing Kociemba's two-phase search. Its two runtime
files are vendored with mechanical ES-module wrapper changes; search logic is
unchanged. The npm package's unrelated npm 6 dependency is deliberately excluded.
The original MIT license, upstream archive/source hashes and adaptation record
are in `packages/solver/vendor`. The license is also shipped with the app.
[Upstream API and license](https://github.com/ldez/cubejs).

This is a generic solution, not a claimed beginner/CFOP/Roux/ZZ method or a promise
of the shortest solution. Returned moves are accepted only when request ID,
SHA-256 input identity, engine version and method match, supported face moves are
bounded, and replay through the independent geometric cube-core solves the exact
submitted state. The engine's own solved flag is not trusted.

The foundation tests cover every face move against the separate engine, 1,000
legal compositions, malformed/invalid states, flipped edge, twisted/mirrored
corner, duplicate pieces, parity, stale/tampered results and 24 random cubie states.
Initial Windows Node 22.23.1 sample: table initialization 1,095 ms; 24 solves
averaged 51 ms, maximum 270 ms. These are measurements of this development
environment, not mobile-device guarantees. Tables are built locally; no remote
solver or user-state upload is involved.

## Delivery status

The validated domain/engine foundation is the first coherent change set.
The manual editor, cancellable worker, playback, lessons and their browser/live
verification are being added in the next change set of this milestone.
