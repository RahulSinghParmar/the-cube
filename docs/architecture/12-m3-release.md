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

## Lessons and playback

Menu now includes **Learn** (`menu.html#/learn`) and **Solve** (`menu.html#/solve`).
Both follow the shared light, dark and contrast themes, touch targets and reduced
motion preference. The homepage remains the original touch simulator.

The revision-1 course contains eight project-authored guided exercises: pieces,
notation, white cross, first-layer corners, middle layer, last-layer orientation,
last-layer permutation and a prepared complete solve. It uses white U, green F
and red R throughout, including yellow D for the last layer. Algorithms and
prepared setups are checked by the independent cube engine; tests also check
that completed stages preserve the earlier layers. The
[official Rubik's guide](https://www.rubiks.com/solution-guides) is linked as an
additional reference. Text is independently authored, not reproduced from it.

Each exercise presents its goal, case limitations, a labeled 3D cube and the next
move in plain language. Learners choose a move and apply it; an unexpected move
leaves the state unchanged. Demonstrations do not earn practice credit. A lesson
records the longest contiguous prefix practiced by the learner and a separate
viewing step. This is an introductory set of prepared cases, not coverage of
every beginner-method case or external cubing-instructor certification. Further
learner testing and instructional review remain useful before broad course claims.

Solution playback provides next, previous, restart, play/pause and three speeds.
The previous step applies the inverse move. Only completed animations advance the
logical cursor. Hiding the page pauses automatic playback; route exit disposes
the renderer. A text face grid remains available when 3D cannot initialize.
Playback does not edit the original input or other saved cubes. An already solved
input returns zero moves and still passes independent verification.

## Manual entry and worker lifecycle

Choose a face, pick a color and tap stickers. Centers are fixed; color counts and
entry progress remain visible. Hold the stated neighboring face above and left
when reading each grid. Input can also come from 54 URFDLB letters, a built-in
example or a copy of the saved 3×3 Practice checkpoint. A rotated practice cube
is oriented to canonical centers before copying; other sizes stay in Practice.
The original checkpoint is never written by Solve.

The engine runs in a dedicated worker. Each request carries a unique ID, input
hash, engine/method versions and a deadline. Cancellation, route exit and the
45-second main-thread timeout terminate the worker, including synchronous table
initialization/search. Worker load errors remain visible and retryable. Editing
or restoring input clears the previous result and cancels outstanding work.
Results are shown only after independent verification; a downloadable solution
includes the input and verification metadata for reproducible replay.

The production worker is approximately 20.5 kB before compression. The small
revisioned lesson catalog and lazy route assets ship in the normal offline shell;
there is no separate content-pack download UI. The existing versioned service
worker precaches those assets and the engine license. Tables are initialized on
this device per request, with no remote state upload or solver API dependency.

## Saved data and recovery

Two new pathname-scoped localStorage records are introduced:

- `the-cube-lessons-v1:/the-cube/`: course version, lesson revision, viewing step
  and practiced prefix.
- `the-cube-solver-input-v1:/the-cube/`: version and 54 input stickers, allowing
  unfinished entries. Playback itself is temporary.

Original `theCube_*`, M2 checkpoint/preferences and M1 IndexedDB names and schemas
are unchanged. No migration or clearing of old data is required. Saves happen
only after explicit input/progress changes. Unreadable records are preserved and
can be downloaded before explicit replacement. Failed writes keep the on-screen
state, show an error and offer retry/download. A changed stored value from another
tab is detected before writing and left untouched; this is a small local-record
conflict guard, not an atomic cross-tab database transaction or cloud sync.

Each page can download and restore its own validated JSON backup. Wrong formats,
unknown lesson revisions and out-of-range progress are rejected. Restore requires
confirmation, resets lesson playback to the restored step and clears solver
playback. Backup files are separate from existing cube and timer exports.

## Verification and limits

Run the complete web release checks:

```sh
npm test
npm run build
npm run check:architecture
npm run test:e2e
```

Local release gate: **40 unit tests and 65 browser scenarios passed**, along with
the production build/typecheck and architecture link/contract checks. The browser
suite covers Chromium, Firefox and WebKit. Publication is gated by the repository
[Web checks and Pages workflow](https://github.com/RahulSinghParmar/the-cube/actions/workflows/web.yml).

The release adds unit coverage for lesson stage invariants and browser journeys
for manual painting/reload, legality errors, independently replayed solutions,
reversible playback, cancellation, worker failure/deadline/route cleanup, lesson
progress, backup restore, write failure, conflicting/unreadable records and 3D
fallback. Offline checks stop the actual local origin before loading lessons and
running the real solver worker. Existing M1/M2 and homepage tests remain in place.

Initial Windows browser sample for the same 12-move solution, including table
initialization: Chromium 1,046 ms, Firefox 1,963 ms and WebKit 1,710 ms. These
single samples are diagnostic measurements, not a performance guarantee. Automated
accessibility covers Learn/Solve in the three themes; visual checks include narrow
phone layouts. Real iPhone/iPad/Android, low-memory/suspend behavior, touch comfort,
full accessibility certification and native application packaging remain open.
New lesson/editor text is English; M2's English/Hindi foundation is preserved,
and translated instructional content remains future reviewed work.

## Owner testing

1. Finish an active solve, close all app tabs and reopen the
   [same live URL](https://rahulsinghparmar.github.io/the-cube/). Keep browser data.
2. Open **Menu → Learn**. In the first lesson, apply R then R′. Check that it earns
   practice credit and remains completed after reload. Showing a move alone
   should not mark it practiced. Try the other prepared stages.
3. Open **Menu → Solve → Use a saved cube or an example → Load example**, then
   **Check and solve**. Try Next, Previous, Play/Pause, speed and Restart. At the
   end, expand the six-face grid and check all six faces are uniform.
4. Enter a physical 3×3: keep white on top/green in front, choose each face and
   follow its above/left guide. Tap all stickers and solve. Follow the displayed
   move directions while retaining that orientation.
5. Download input/progress backups. Change something, restore the appropriate
   backup and confirm the input/lesson step returns. Try cancelling a solve.
6. Load once online, disconnect and reopen Learn/Solve. Confirm lessons and the
   solver work, then check the homepage's saved cube, Practice checkpoint and
   Timer sessions are still present.

M4 algorithm training is the next planned milestone and is not started by this
release. The architecture's larger scanner, accounts, coaching and native goals
remain separate milestones.
