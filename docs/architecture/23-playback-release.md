# P2A: shared puzzle capabilities and playback

19 September 2026. React is retained. The original simulator and its panels are unchanged.

## What ships

Guides → Move explorer (`menu.html#/explore`) offers 2×2, 3×3, 4×4 and 5×5 playback. Existing lessons, PLL/OLL/F2L trainers, recognition reveal and solver results use the same player. Play/pause, previous/next, restart, a keyboard/touch timeline, clickable move tokens, 0.5×/1×/2× speed, loop, camera reset, reduced motion and synchronized instructions are shared.

The registry declares model, renderer, notation, random-move scrambling, solver, course, method and device capabilities independently. Only 3×3 has the verified solver and existing learning packs. No 6×6, 7×7, non-cube, full-course or Bluetooth support is implied.

## Notation contract

- Existing outer/wide turns and x/y/z rotations retain their meaning and checkpoint format.
- Lowercase r/u/f/d/l/b are two-layer wide aliases, never inner-slice aliases.
- A numbered face without w selects one internal layer: 2R is the second layer from R. Depth must lie strictly inside the cube.
- M/E/S select the single middle slice on odd cubes, in the directions of L/D/F. Even cubes require explicit numbered layers.
- Prime and half-turn suffixes apply to each form. Unicode prime is normalized. Canonical checkpoints serialize inner slices by their numbered face.
- The explorer accepts up to 500 space-separated moves / 10,000 characters. Unsupported sizes, groups, commutators and ambiguous even-cube middle moves fail visibly without replacing the displayed sequence.

Outer/wide/rotation terminology is informed by [WCA notation](https://www.worldcubeassociation.org/regulations/#article-12-notation). Numbered inner layers and middle-slice aliases are the explicitly documented application dialect; this explorer is not an official scramble generator.

## State and lifecycle

The pure compiler creates bounded state snapshots once per input/sequence. Seeking jumps to the selected completed-move boundary; adjacent next/previous actions animate a move or its inverse. Descriptions, progress callbacks and face grids change only after the state commits. Pause during a turn restores the last completed boundary. A generation counter prevents interrupted animation from committing later. Changing the input remounts the player; changing a progress callback does not.

Pause synchronously cancels the scheduled autoplay timer; timer callbacks also check current playback and visibility before moving. This avoids depending on React effect cleanup timing. Cross-browser tests advance virtual time until the loop boundary and verify that the last completed step remains stable after hiding the page.

Hidden tabs and players outside the viewport stop playback without automatically resuming. OS reduced-motion changes are observed live, alongside the existing preference and a local player checkbox. Reduced motion switches states without turn animation. WebGL failure retains controls, explanations and size-correct face grids.

The renderer reuses geometry, label textures and materials while size/label configuration is unchanged. It renders on input, resize and active turns, with no perpetual idle animation loop. Disposal cancels frames, removes pointer/resize observers, disposes owned resources and releases the WebGL context.

## Preservation

No storage keys, schema versions, lesson/case IDs, practice credit rules or original simulator files change. Watched/seeking steps can save a resume position through existing callbacks but cannot earn manual credit. Explorer input is temporary and does not overwrite the saved virtual cube. Existing bookmarks and the live root URL remain intact. No dependencies, services, accounts or uploads are added.

## Verification and limits

- Independent indexed face-grid cycles qualify outer, wide, inner and whole-cube permutations separately for each size. Existing solver fixtures and all 2–5 checkpoints remain covered.
- Browser checks cover matching forward/reverse/seek states, explanations, looping, interrupted turns, hidden-tab pause, live reduced motion, unmount, lesson reload/credit, invalid/empty sequences, text fallback, GPU texture reuse/disposal, offline operation and 320/820/1440 px overflow/accessibility.
- The 500-move snapshot benchmark on the development Windows desktop measured approximately 2–3 ms per size after permutation warm-up. This is not a physical low-end phone frame-rate claim. Hardware profiling remains part of P2B/P9 qualification.
- The original theme is retained. The separately tracked light/dark/system preference capability remains partial; no new system-theme mode or appearance redesign is included.

## Try it

1. Open Guides → Move explorer, or find it through Find a tool.
2. Select each size. Try Next move, Previous and Restart, then move the timeline and compare the explanation/face grid.
3. On 4×4 load `2R U 2R'`; on 5×5 try `3Rw M M' 3Rw'`.
4. Play at each speed, pause during a turn, try looping and Reduce motion. Drag the cube, then Reset viewing angle.
5. Revisit an existing lesson/trainer and reload. Your previous progress remains; merely watching or seeking does not count as practice.

Next: P2B measured stack/rendering evaluation, followed by P3A catalog consolidation. No framework migration is authorized by this release.
