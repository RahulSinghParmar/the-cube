# M4 second release: PLL recognition drills

**Menu → Train → Try recognition drills** opens `menu.html#/recognize`. This
extends M4 with identification practice using the existing 21 verified PLL setups.
The original guided trainer, homepage and all existing data formats are retained.
OLL/F2L remain planned.

## Round behavior

Start recognition to see an unidentified 3D cube and top diagram. Choose a case
name and check the answer, or reveal it. No algorithm, case heading or group hint
is shown before submission. The six-face text alternative remains available.
Feedback states the expected case, your choice and the piece destinations; optional
3D playback explains the solution without altering recognition or guided totals.

Cases are drawn uniformly with no immediate repeat within a visit. Optional extra
practice adds one draw weight for each mistake or reveal for that case in the
latest 100 retained attempts. Every case remains available. These are the verified
white-U/green-F fixtures; random viewing angles and extra U adjustments are not
part of this release. Performance here measures these prepared patterns rather
than every possible orientation or physical-cube execution.

Timing is off by default and its preference is saved. A monotonic clock starts
when the question renderer (or fallback) is ready and ends on submission. It
includes selecting the answer, so it is not a pure reaction-time measurement.
Settings cannot change during a round. Switching to another tab, leaving the
route or reloading discards unfinished work without adding an attempt. Background
rounds are not counted as slow answers. Reveals are recorded as missed and untimed.
Correct and incorrect submissions can have times, but the displayed median uses
only correct timed answers. Submitting once locks the round against duplicate
credit. Saving failures block the next round until recovery.

## History and recovery

A separate `the-cube-pll-recognition-v1:/the-cube/` record stores version 1, the
timing preference and the latest 500 attempts. Each attempt has a unique ID, case,
answer (null for revealed), timestamp and nullable duration. Accuracy is correct
answers divided by all retained attempts, including reveals. The interface shows
the latest 50 rows; JSON export includes all retained attempts. The 500-attempt
retention limit applies to statistics too; no unbounded all-time total is implied.

The existing learning-storage recovery controls validate imports, protect corrupt
records, warn about another tab's writes and support retry/backup. Unknown cases,
duplicate IDs, malformed timestamps/durations and incompatible backup types are
rejected. Recognition restores replace only the recognition record after review;
they cancel the current round and its feedback. Old guided PLL, M3 lesson/input,
M2 cube/preferences, legacy simulator and M1 IndexedDB keys are unchanged.

The academy domain owns random selection, bounded history and statistics. The web
route uses the shared renderer, case diagram and playback. No new runtime package
or external service is required. The route and its assets join the existing
service-worker precache for offline use after an online visit.

## Verification and owner checklist

The release validation includes 48 unit tests, production build/typecheck,
architecture checks and 92 browser scenarios across Chromium, Firefox and WebKit.
New scenarios cover wrong/correct feedback, hidden instructions, no immediate
repeat, timed/untimed results, interruption/reload, reveals, export/restore,
failed/corrupt writes, multiple tabs, offline origin shutdown, no-WebGL fallback and
320 px layout. Accessibility checks exercise active questions and feedback in all
three themes. Built-in-browser interaction review supplements automation. Physical
phone/tablet qualification remains open.

1. Open **Train → Try recognition drills**, leave timing off and start.
2. Pick a case, check your answer and inspect the explanation. Open **Explain with
   3D playback** to try Next/Previous. The result should stay unchanged.
3. Start another pattern and reveal it. Accuracy includes that missed attempt.
4. Enable **Time my answers** between rounds. Submit an answer; only a correct
   timed answer contributes to the median correct time.
5. Reload and expand **Recognition history & backups**: completed results remain.
   Switching away during an unfinished round should instead show an interruption.
6. Export a backup before moving devices. Existing guided repetitions, lessons,
   saved cubes and physical timer history should remain available.

Next suggested command: `Help me test PLL recognition drills on my device before starting OLL.`
