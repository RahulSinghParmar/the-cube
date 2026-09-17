# Tutorial experience: first solve through larger cubes

17 September 2026. Requirements and implementation assessment after the owner's
review of P1. This document is a tutorial design specification, not a shipped
course. P1 remains the latest application release.

## Reference and intended experience

The primary visual reference is the [SpeedcubeQuest beginner tutorial](https://speedcube.quest/guides/how-to-solve-a-rubiks-cube),
inspected in the built-in browser. Match its readable lesson hierarchy and
interaction pattern closely: a course overview, persistent contents, numbered
stages, small explanations beside animated examples, synchronized instructions
and visible target states. Use the project's own branding, authored explanations,
verified examples and appropriately licensed components. Keep the original
homepage simulator, original settings/statistics and saved data.

The reference's [Guides](https://speedcube.quest/guides) area lists 3×3 beginner,
F2L, two-look last-layer and notation/glossary resources. Its
[4×4](https://speedcube.quest/algorithms/big-cubes/4x4) and
[5×5](https://speedcube.quest/algorithms/big-cubes/5x5) destinations are algorithm
collections. A full beginner course for every size is an additional product
requirement, not something already delivered by copying that navigation.

The [credits](https://speedcube.quest/credits) identify cubing.js/TwistyPlayer as
the interactive-cube foundation. Evaluate that playback adapter in P2. A Svelte
migration is not required to build the tutorial layout on the current React app.
References are not imported code or content; the source-register rules in
[the dependency review](18-reference-review.md) still apply.

## Course layout

Guides begins with a puzzle selector: 2×2, 3×3, 4×4 and 5×5. Each course shows
prerequisites, its learning stages, coverage and a Resume action when available.
Only published courses have Start actions. Future puzzles remain clearly planned
until their engine, content and verification are ready.

On desktop, a narrow sticky contents column sits beside the lesson. On phones,
contents collapses into a labeled step selector and the cube sits above its
instructions. Tablet layout follows available width, not device detection.
Use short readable headings, restrained colored stage accents, generous spacing
and prominent goal diagrams. Keep the original display identity on the homepage;
the tutorial should prioritize reading comfort. Match the reference's lesson
composition rather than reuse the current large promotional section cards.

Each stage contains:

1. **Goal:** the pieces or layer the learner is trying to complete.
2. **Hold it this way:** top/front orientation with color and face labels.
3. **Find your situation:** visible cases and setup instructions, including an
   already-finished case and common misplaced pieces.
4. **Watch:** a 3D example with the current instruction highlighted.
5. **Try:** a short action on a physical or virtual cube.
6. **Check:** a target diagram and a plain-language success checklist.
7. **Need help:** wrong orientation, trapped pieces and recovery paths.
8. **Continue:** next stage, previous stage and saved resume position.

Prepared examples are labeled. A learner confirming a physical checkpoint is
self-reported progress; it is not an automatically verified solve. Watched,
self-confirmed and guided-execution progress remain separate. The existing
generic solver remains available for manual input, without calling its output
a beginner-method explanation.

## Playback contract

- Play/pause through a complete example; previous/next move; restart.
- Drag or keyboard-adjust a timeline to a known state; show the current move.
- Replay a whole example or a named substep; optional loop, off by default.
- Speed control changes actual playback cadence, with immediate pause response.
- Selecting an instruction seeks to its start; animation updates the instruction.
- Rotate the view and reset it without changing the logical cube state.
- Highlight relevant pieces and mute unrelated stickers; provide a readable
  diagram/text alternative when WebGL is unavailable.
- Pause when hidden, scrolled out of view, navigating away or changing examples.
  Respect reduced motion and do not autoplay every cube on a long page.
- A stage overview uses static thumbnails. Mount interactive players lazily and
  limit simultaneous renderers, especially on phones.

Timeline positions derive from deterministic cube states. Seeking backward must
restore those exact states; reverse visual animation must not approximate them.
Use full sequence and stage checks to detect incorrect setup or orientation.

## Course releases

| Release | Coverage | Required evidence |
| --- | --- | --- |
| P4A — 3×3 first solve | Piece types and notation; daisy and aligned white cross; first-layer corners; middle edges; last-layer orientation; corner/edge placement; recovery and final checks | Full stage/case coverage, independent fixtures, correct orientation cues and a learner journey beyond a single inverse-generated example |
| P4B — 2×2 first solve | Corner-only structure; complete first layer; last-layer orientation and placement; optional later Ortega path | Every chosen method case, no reliance on fixed center pieces, complete solved-state verification |
| P4C — 4×4 first solve | Centers and color scheme; edge pairing; reduction to 3×3; required parity recognition and fixes | Wide/inner-layer notation, center/edge predicates, parity fixtures and preservation of completed work |
| P4D — 5×5 first solve | Centers; edge groups; last-two-edge situations; reduction and finish | Correct wing/middle-edge handling, size-specific cases and no assumption that 4×4 parity instructions transfer unchanged |
| P4E — Faster-solving bridges | Intuitive F2L, two-look last layer, then links to full OLL/PLL and deliberate practice | Clear prerequisites, verified case taxonomy and compatible saved progress |

Each course is an independently publishable release, followed by device testing.
Do not advertise a size as fully taught merely because its simulator renders.
6×6, 7×7 and other puzzles are future packs; the current domain only accepts
sizes 2–5. Their support needs a separate domain/notation/rendering assessment.

P4A can be prioritized ahead of the technology comparison if the owner chooses;
it does not require the expanded P3 catalog. Preserve P2 as a separate measured
technology decision and P3 as the expanded algorithm library. Do not couple a
framework cutover, original-panel redesign or data migration to the tutorial.

## Current-code assessment

| Existing part | Retain | Needed extension |
| --- | --- | --- |
| `LearnPage.tsx` | Existing eight prepared exercises and saved IDs at `#/learn` | New full-course route and course navigation; old progress remains meaningful |
| `SequencePlayer.tsx` | Deterministic states, inverse steps, renderer cleanup, failure feedback | Timeline, instruction segments, loop, example selection, tutorial playback controls and puzzle-size awareness |
| `packages/cube-core` | Exact 2–5 cube states, face/wide moves and rotations | Qualify every notation form and size required by course examples; do not silently coerce inner-slice notation |
| `renderer.ts` | Existing render adapter and original cube appearance | Optional instructional highlighting and explicit orientation; keep default appearance unchanged |
| `learning-storage.tsx` | Save failure, export/restore and conflicting-tab recovery | Separately versioned tutorial progress and selected stage/example; preserve old lesson records |
| Current prepared lesson fixtures | Useful small drills | Independent examples and stage predicates sufficient for each published course's claimed case coverage |

The current player hardcodes 3×3 parsing and face grids. The current lesson
exercise mode hides continuous playback/speed controls. Its fixed white-on-top
teaching orientation must not silently conflict with a new white-on-bottom
beginner course. Make the new course's orientation explicit and test conversions.

## Verification and delivery

Keep current URLs, store keys, case IDs, backups and original renderer behavior.
Add tutorial progress separately. Confirm upgrade and rollback leave existing
records intact. Review each algorithm against its declared case/stage predicate,
not only its own inverse setup. Check recognized completed/skipped stages and
recovery instructions, as well as the successful example.

Test play, pause during a turn, reverse, seek, loop, speed changes, segment
selection, route exit and hidden-page behavior. Include reduced motion, keyboard,
screen-reader names, 320-pixel layout, tablet/landscape, unavailable WebGL and
offline reload. Check saved resume, corrupted data, failed writes, export/restore
and another-tab edits. Record bundle size and player lifecycle measurements.

Use the built-in browser for visual comparison and live verification. Push each
coherent verified release to main; preserve master. Report the exact course and
case coverage and the remaining physical-device tests.

## Relationship to the whole reference site

The [whole-product audit](21-product-coverage.md) supersedes the short capability
map below. Tutorials are one workstream within the complete product scope.
The next shared foundation is P2A; the P4A prompt below remains a focused course
command, not the default answer to the full-site request. Larger-cube and
blindfold extensions are now explicitly tracked as P4F.

The [main reference site](https://speedcube.quest/) combines lessons, algorithm
collections, trainers, timing, statistics and advanced tools. Track functional
coverage by release instead of treating “everything” as one publishable change:

| Capability | Project phase |
| --- | --- |
| Section navigation | P1, shipped |
| Searchable case libraries, favorites and variants | P3 |
| Complete tutorials and multi-size learning | P4A–P4E in this document |
| Recognition, guided practice and review | Existing M4 plus P5 expansion |
| Timer, history and richer statistics | Existing M1 plus P6 |
| Smart cube connection | P7 web / P9 native qualification |
| Accounts and cross-device progress | P8 |
| Additional methods/puzzles and solve analysis | Bounded P10 content/tool releases |

This is a capability map, not a claim of feature parity or permission to copy the
reference's data, branding or proprietary implementation.

## Next implementation prompt

```text
Build P4A from docs/architecture/20-tutorial-experience.md on the current React app.
Closely follow the reference tutorial's readable layout, stage navigation,
goal diagrams and synchronized cube explanations. Build a complete reviewed
3×3 beginner course with play/pause, previous/next move, replay, timeline seeking,
speed control, visible checkpoints, recovery help and saved resume.
Keep the original homepage/theme/panels, existing lessons, data and URLs.
Verify case coverage and stage outcomes; do not label one prepared example a
complete method. Use the built-in browser, push verified changes to main,
verify Pages and explain device tests. Leave 2×2, 4×4 and 5×5 for their named
course releases; do not migrate frameworks as part of this tutorial release.
```
