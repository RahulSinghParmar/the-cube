# M4 fourth release: beginner F2L training

The trainer now includes **Learn F2L** at `menu.html#/f2l`, linked from both
PLL and OLL. The original touch simulator, Settings, Statistics, live URL and
existing records are unchanged.

## Scope and learning path

Twelve guided setups cover ready pairs (four starting positions), separated
pieces (four), a mismatched pair (one), and pieces trapped in the target slot
(three). These are project lesson IDs, not standard F2L case numbers. This is
a beginner path, not the full 41-case catalog, a recognition test, or an
arbitrary-state F2L solver. Other slot angles remain future work.

The view stays consistent with the other trainers: white U above, yellow D
below, green F in front, red R to the right. The yellow cross is solved. The
target is the yellow-green-red corner and green-red edge in the front-right
slot. Beginners who normally solve a white cross are explicitly told to use
these face letters and colors instead of copying their usual orientation.

Explanations introduce finding, pairing and inserting. Each sequence has
phase guidance and a piece-location guide derived from the current state.
Users can rotate the view, reset the camera, step forward/back, autoplay at
three speeds, or use the six-face text alternative. Existing reduced-motion
preferences apply. Shared trainer styles retain the current app theme;
there are no changes to the original simulator appearance or renderer.

## Content provenance and correctness

The [CubeSkills F2L module](https://www.cubeskills.com/tutorials/f2l) and
[algorithm reference by Feliks Zemdegs and Andy Klise](https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf)
were consulted on 16 September 2026 for conventional insertion and pairing
techniques. Text, lesson ordering and prepared fixtures are project-authored;
third-party diagrams and lesson prose are not reproduced.

Frozen fixtures are built with the independent cubejs engine, beginning with
a valid unsolved last layer and applying inverse face-turn sequences. Before
playback, the core validates legality, the protected cross/three slots, the
unsolved target at the start, and completed lower layers at the end. The last
layer remains unsolved. Intermediate turns may temporarily disturb solved
pieces; the UI explicitly explains this.

Unit checks independently replay every move using cubejs, assert fixed cubie
positions/orientations for the cross and three other slots at the start and
all four pairs at the end, and check lesson categories and piece directions.

## Saved guided practice

`the-cube-f2l-v1:/the-cube/` stores version 1, selected lesson ID and per-case
revision, cursor, contiguous manually practiced moves, repetitions and
incorrect choices. Existing keys/databases are neither migrated nor replaced.

A repetition requires every move to be applied manually in order. Watching,
autoplay and Show next move do not earn credit. Rewinding cannot duplicate a
completion; Start new repetition resets only that case's current attempt.
Reloading retains the saved selection, cursor and totals; select Practice
moves to resume. Totals do not claim memorization or physical solve speed.

Imports validate lesson IDs, revisions, bounds and numeric fields. PLL/OLL
backups cannot be used as F2L progress. Malformed records remain intact;
write failures and another-tab conflicts expose the existing recovery UI.
Download and restore operate only on the separate F2L record.

## Verification and owner test

Coverage includes all catalog entries, manual and watched playback, a wrong
move, partial reload/resume, one-time completion credit, selection persistence,
backup round-trip, malformed/foreign records, quota recovery, tab conflicts,
320 px and tablet layouts, automated accessibility, and offline operation with
WebGL unavailable. The full suite also exercises the unchanged M1-M4 routes.
Local validation passed 55 unit tests, the production build/type checks and
architecture checks. The 128-test browser run passed 127 checks; one Firefox
lesson could not bind a Windows-reserved test port. The test fixture now retries
reserved ports and collisions. All 18 F2L/lesson checks then passed across the
three engines. Built-in browser review confirmed the phone layout, partial
reload/resume and one completed guided repetition.
Physical iPhone/iPad testing remains a device qualification step.

1. Open **Menu → Train → Learn F2L** and expand **New to F2L? Start here**.
2. Keep setup 1. Use **Next move**, **Previous** and **Play solution** in Watch
   mode; the guided repetition count should remain zero.
3. Choose **Practice moves**, apply `R`, then reload. Choose Practice moves
   again: the next move should be `U′` and the cursor should be 1 of 3.
4. Apply `U′` and `R′`. You should see one guided repetition, matching side
   colors in the lower layers, and an unsolved last layer.
5. Try a trapped-piece setup, inspect the piece guide, and download/restore an
   F2L backup. Confirm your old OLL/PLL progress and timer sessions still appear.

Next suggested message: `Help me test F2L guided practice on my device before expanding M4.`
