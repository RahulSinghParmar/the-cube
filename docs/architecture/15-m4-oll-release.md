# M4 third release: OLL training

**Menu → Train → Learn OLL** opens `menu.html#/oll`. The library includes all 57
numbered OLL cases with orientation diagrams, explanations, 3D playback and saved
guided repetitions. Sune (OLL 27) is selected initially. The existing PLL library
and recognition drills keep their routes, behavior and saved records.

## What the exercises teach

OLL orients every last-layer sticker upward after the first two layers are solved.
PLL subsequently places those pieces. Each prepared OLL exercise therefore ends
with a uniform white U face and solved lower layers, but with a valid PLL case
still remaining. Completion copy explicitly distinguishes this from solving the
whole cube. These setups finish in Ua; returning to the PLL library does not
silently replace its selected case or partial progress.

Hold the white U center on top and green F center in front. The diagram highlights
white stickers and renders other colors gray. Compare the entire white pattern,
including the side rows. The library filters by oriented upper edges: Cross (all
four), Line (two opposite), Angle (two adjacent) and Dot (none). The Cross group
contains seven corner-orientation cases. Individual sticker descriptions provide
a text alternative for all four upper corners and edges. These original
explanations describe the supplied viewing angle, not every rotated viewpoint.

Watch mode has reversible playback, autoplay and speed controls. Practice mode
requires applying the displayed moves yourself. Demonstrations award no repetition;
incorrect moves leave the cube unchanged and count as incorrect choices. Partial
work resumes after selecting Practice moves following a reload. Replaying the last
move cannot double-count completion. Start new repetition resets only the current
sequence, retaining totals. Counts represent guided practice, not memorization or
physical solve speed. The 57-card library scrolls independently on desktop and is
initially collapsed on phones; existing theme and reduced-motion behavior remain.

## Provenance and correctness

The immutable catalog retains numbered reference sequences from the
[CubeSkills OLL reference by Feliks Zemdegs and Andy Klise](https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf),
a fixed-orientation outer-face-turn equivalent and frozen input facelets. Original
reference half turns are normalized (`U2'` and `U2` have the same effect).
Wide and slice moves and cube rotations are converted to the supported 18 face
turns. These versions can be longer than speed-focused finger-trick algorithms;
they are not claimed to be optimal. PDF illustrations and prose are not copied.

The independent cubejs engine checks each converted sequence against its reference
and generates inverse setups from an oriented PLL target. Unit tests compare both
engines, validate legal input, verify restored lower layers and oriented U, and
confirm the final state still requires PLL. A separate test enumerates all 216
legal orientation patterns and verifies that the catalog has 57 distinct classes
under U adjustments and covers those patterns together with the already-oriented
class. The app verifies each case before enabling playback. Mathematical checks
do not constitute a real-device or independent teaching-quality review.

## Storage and architecture

`packages/academy` owns the catalog, orientation guide, verifier and bounded
progress schema. The web route reuses the case-diagram primitive, renderer,
SequencePlayer and learning-storage recovery controls. The new key is
`the-cube-oll-v1:/the-cube/`, with version, selected case and per-case revision,
step, practiced prefix, repetitions and incorrect choices. No existing keys or
IndexedDB stores are migrated or removed. OLL backups are validated independently;
PLL and recognition backups cannot be accepted as OLL progress.

Failed writes retain on-screen work and expose retry and backup. Corrupt records
are protected from automatic overwrite, and another-tab changes are detected by
the shared storage boundary. The lazy OLL assets join the existing service-worker
precache. No new runtime dependency, server or hosting service is introduced.

## Validation and owner checks

Release checks cover 51 unit tests, build/typecheck, architecture links and 104
browser scenarios across Chromium, Firefox and WebKit. OLL scenarios select every
case, check filtering and 320 px layout, exercise playback and manual completion,
confirm oriented-but-not-solved output, reload, restore backups, reject incompatible
imports, recover failed writes and use offline/no-WebGL fallbacks. Automated
accessibility checks include the OLL page in all themes. Built-in-browser review
covers the diagram, instructions and actual 3D interaction. Physical phone/tablet
qualification remains separate from browser emulation.

1. Open **Train → Learn OLL**, leaving **OLL 27 · Sune** selected.
2. Use Next move and Previous in Watch mode. Open the sticker guide to compare
   the highlighted white pattern with the 3D cube.
3. Select Practice moves. Apply R, reload, then select Practice moves again;
   step 1 should resume. Complete the seven displayed moves yourself.
4. Expect one guided repetition. The top is now white; the side rows still need
   PLL. Existing PLL progress must remain available when you return to its library.
5. Try the Cross filter (seven cases), then choose a Line, Angle or Dot case.
   Expand Progress backups & algorithm sources to export before changing devices.

Next command: `Help me test OLL practice on my device before starting F2L.`
OLL recognition drills, F2L and optional collections remain future M4 work.
