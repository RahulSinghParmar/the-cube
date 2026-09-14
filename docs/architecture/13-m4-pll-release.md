# M4 first release: PLL trainer

The first M4 release adds **Menu → Train** at `menu.html#/train`. It contains all
21 PLL cases: Ua, Ub, H, Z, Aa, Ab, E, T, Ja, Jb, Ra, Rb, F, Y, V, Na, Nb and
Ga–Gd. M4 remains in progress; timed recognition, OLL/F2L libraries and an optional
collection system are outside this release.

## Learning and playback

Choose a case from the selector or grouped pattern library. Each prepared setup
shows a top-view diagram, a group explanation and a piece-by-piece destination
guide. The library collapses initially on narrow screens. The existing shared
3D player provides next/previous, play/pause, speed control, viewing-angle reset,
move explanations and a six-face text alternative. Reduced motion and unavailable
WebGL retain the existing fallbacks.

These setups have **white U on top and green F in front**, with the two lower
layers solved. The side rows reveal the permutation. Keep that orientation through
the sequence. This differs from some beginner exercises that solve the last layer
on D; the trainer states its viewing convention explicitly.

Watch mode starts from the case setup and awards no progress. Practice mode resumes
the saved step. Choose and apply the expected move; a wrong choice leaves the cube
unchanged and increases the incorrect-choice count. Only a contiguous sequence of
manually applied moves earns one guided repetition. Demonstrated moves do not count.
Going back and replaying the final move cannot earn another repetition. Use
**Start new repetition** to reset the current sequence while retaining totals.
Guided repetition counts describe displayed-move practice, not memorization,
recognition speed or physical solve performance.

## Content provenance and verification

The catalog retains conventional reference sequences from the
[CubeSkills PLL reference by Feliks Zemdegs and Andy Klise](https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf).
Explanations, layouts and diagrams are authored for this application; the reference
PDF's illustrations and prose are not copied. The catalog stores each original
sequence, a fixed-orientation outer-face-turn equivalent, and a frozen setup.
Rotations and slice moves are expanded into the supported 18 face turns. Some
sequences, especially H and Z, are therefore longer than finger-trick versions.
Final U adjustments are included. These are not claimed to be fastest algorithms.

The independent vendored cubejs engine generates inverse setups and checks the
reference sequence after normalizing its final viewing orientation. Unit tests
compare the face-turn edition to that reference and solve each fixture using both
engines. The application checks legality, oriented U, solved lower layers and exact
solved completion before offering playback. A classification test enumerates all
288 legal oriented upper-layer permutations, verifies the 21 catalog cases are
unique under before/after U adjustments, and confirms coverage together with the
already-solved adjustment class. Mathematical validation does not replace
real-learner feedback on explanation quality.

## Architecture and saved data

`packages/academy` owns the immutable catalog, verification, piece explanations and
bounded progress schema. `TrainerPage` composes that domain with the shared player
and learning-storage recovery controls. No additional runtime dependency, cloud
service or image asset is introduced. The route loads lazily and its assets join
the existing service-worker precache.

The new key is `the-cube-pll-v1:/the-cube/` on the production subpath. Its versioned
record contains the selected case plus case revision, current step, contiguous
practice prefix, completed repetitions and incorrect choices. Validators reject
unknown cases, incompatible revisions and invalid counters. No old key is migrated
or removed. Legacy cube records, M1 IndexedDB, M2 checkpoints/preferences and M3
lesson/input keys retain their existing schemas.

Failed writes remain visible, retain the current in-memory work and offer retry
and backup. Malformed existing records are protected from automatic overwrite.
**Progress backups & algorithm sources** contains export and validated restore;
restoring confirms replacement of the PLL record only. A lesson or solver-input
backup cannot be silently accepted as PLL progress.

## Verification and owner test

The release checks include 44 unit tests, production build/typecheck, architecture
links and 77 browser scenarios across Chromium, Firefox and WebKit. PLL coverage
includes all case selections, 320 px layout, playback, wrong moves, partial reload,
repetition deduplication, download/restore, failed writes, malformed saves, offline
navigation with the actual preview origin stopped and no-WebGL fallback. Automated
accessibility checks include Train in all three themes. Built-in-browser visual and
interaction review supplements the automated tests. Physical iPhone/iPad testing
and app-store qualification remain open; browser emulation is not a device claim.

1. Open **Menu → Train**, leave **Ua** selected and try **Next move**, **Previous**
   and **Play solution** in Watch mode. No repetition should be earned.
2. Select **Practice moves**. The first expected move is R. Choose U and apply it:
   the cube stays at step 0 and the message tells you to try R.
3. Choose R and apply it. Reload, then select **Practice moves** again: step 1 and
   your incorrect-choice count should remain.
4. Finish the displayed sequence. Expect one guided repetition and one case
   practiced. Use **Start new repetition** when you want another attempt.
5. Select another case, inspect the piece guide, then return to Ua. Its progress
   should still be available. Export a backup before moving devices.

After a deployment, close existing app tabs and reopen if the older service worker
is still active. The public homepage and live URL remain unchanged. Next command:
`Help me test the PLL trainer on my device before adding timed recognition or OLL.`
