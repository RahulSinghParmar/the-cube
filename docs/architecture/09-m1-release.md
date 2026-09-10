# M1 implementation and release checks

## Timing and statistics foundation

The private `packages/practice` workspace compiles with strict TypeScript. The retained simulator remains independently bundled. `npm test` compiles the workspace and runs both existing regressions and the new deterministic timing/statistics tests; `npm run build` also rejects type errors.

The timer uses an injected monotonic clock, a 300 ms hold-to-arm gesture, owned input pairs and explicit interruption. A separate native-click input path avoids requiring a timed hold for assistive input. Inspection starts on its own release; the stop release cannot arm another solve. Focus loss interrupts a running solve. Inspection expires as DNF at 17 seconds.

The practice rule profile follows the [WCA inspection boundaries](https://www.worldcubeassociation.org/regulations/#A4d1), checked against the April 1, 2026 regulations: start before 15 seconds without an inspection penalty; from 15 seconds add two seconds; at 17 seconds record DNF. This is a practice implementation, not a certified competition timer.

Statistics retain raw milliseconds, apply cumulative two-second penalties, exclude interrupted/deleted attempts and include DNF. Ao5/Ao12/Ao100 trim respectively 1/1/5 attempts at each end. Missing samples display a dash; an untrimmed DNF makes the average DNF. These larger practice averages are product rules. Personal best and averages are recalculated from records after edits. Centiseconds are rounded only for display.

M1 remains in progress until storage, recovery, the user interface and complete browser journeys are verified.
