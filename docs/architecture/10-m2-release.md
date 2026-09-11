# M2 web release: interface and cube engine

Navigation update: the later [homepage refinement](11-home-and-menu.md) restores
the original touch cube at the root URL. The M2 screen described below is now
**Menu → Practice** at `menu.html#/play`; Settings is `menu.html#/settings`.
Storage keys and the cube engine are unchanged by that navigation update.

11 September 2026. M2 implements the web scope below. The public entry remains
https://rahulsinghparmar.github.io/the-cube/. Native installation, physical-device
qualification, a full translation and a full accessibility audit remain separate
work; browser automation is not a substitute for those checks.

## Delivered steps

| Step | Implementation | Verification |
| --- | --- | --- |
| T-201 | Pure strict TypeScript cube core for 2×2–5×5, versioned state and replay validation | Inverse/four-turn invariants, color conservation, orientation fixtures and invalid checkpoint rejection |
| T-202 | Three.js renderer port, integer-to-geometry mapping, animation cancellation/disposal and reduced motion | All sizes render; changing routes/settings leaves one canvas; accepted moves survive reload |
| T-203 | Queue of 32 active/pending moves, twelve custom keys, whole-cube rotations and visible failure feedback | Ordered queue/overflow/disposal tests, input remapping and duplicate-key rejection |
| T-204 | React/Vite Play and Settings, responsive controls, face-letter net, cube backup/import and virtual practice timer | Desktop and 320-pixel layout, reset/import review, scramble-to-solved timing and saved-state round trip |
| T-205 | Light/dark/high-contrast themes, focus handling, native dialogs and English/Hindi message catalogs | Keyboard journeys, persisted preferences and automated WCAG AA scans on Play/Settings in all themes |
| T-206 | Explicit original simulator loader, retained physical timer and versioned offline assets | Original game resume, M1 recovery suite, timer history across navigation and offline origin outage in three engines |

The new Play page uses buttons or keyboard shortcuts to turn faces. Dragging the
cube changes the camera view. The original swipe-based simulator remains at
`legacy.html`, including its original saved game, settings and score history.
The physical timer remains at `timer.html`; it retains M1 inspection, sessions,
statistics, penalties and backup/recovery behavior. New themes and Hindi labels
apply to Play/Settings; retained pages and some technical/status text remain English.

## State and renderer contract

`packages/cube-core` has no browser, React or Three.js dependency. A checkpoint is
`{ state: { schemaVersion: 1, size, convention: "URFDLB-v1", facelets }, moves }`.
The facelets are row-major, viewed from outside each face, in U/R/F/D/L/B order.
Sticker letters identify colors: U white, R red, F green, D yellow, L orange, B blue.

For size N, set m=N−1, a=2×column−m and b=m−2×row. Coordinates are integer triples:

| Face | Position | Outward normal |
| --- | --- | --- |
| U | (a, m, −b) | (0, 1, 0) |
| R | (m, b, −a) | (1, 0, 0) |
| F | (a, b, m) | (0, 0, 1) |
| D | (a, −m, b) | (0, −1, 0) |
| L | (−m, b, a) | (−1, 0, 0) |
| B | (−a, b, −m) | (0, 0, −1) |

R takes the front-right column to the up-right column; U takes the front-top row
to the left-top row. The core parses quarter/inverse/double face turns, wide
turns with valid layer counts, and x/y/z rotations. Rotations change logical
facelets; a uniformly colored cube is solved in any whole-cube orientation.
Camera dragging is cosmetic and never changes the checkpoint.

The renderer animates the command then snaps to the exact integer result. Only
completed moves are checkpointed. Leaving during pending moves shows a warning;
internal navigation waits for the queue. Renderer failure restores the previous
checkpoint, and save failure reports that the in-memory cube must be exported.

Reachability is verified by replaying at most 20,000 moves from solved. Imports
are limited to 2 MiB and require a matching facelet result. This is a proof for
app-generated states, not a general scanner/manual-facelet legality validator.
General 3×3 legality and independent solver verification belong to M3. The move
counter includes the scramble and inverse commands. Reversing the last move
appends its inverse to preserve the proof; it is not a history editor.

## Saved data and compatibility decisions

| Data | Storage / policy |
| --- | --- |
| M1 sessions and solves | Existing IndexedDB namespace `the-cube-practice:guest:/the-cube/`; no schema/key migration in M2 |
| Original simulator | Existing `theCube_*` local keys; loaded only by the original simulator, never guessed into the new engine |
| New cube checkpoint | `the-cube-v2:/the-cube/` in localStorage; replay validated before use |
| New preferences | `the-cube-preferences-v2:/the-cube/` in localStorage; validated keys/theme/locale |

Paths are derived from the hosting directory, so root hosting also works without
sharing storage with the project subpath. An invalid new checkpoint is retained
and moves are disabled until an explicit replacement. Export the original data
before choosing **Start a new cube**. No operation clears M1 or legacy storage.

The bounded cube checkpoint uses one atomic localStorage value as an M2 exception
to the target IndexedDB architecture. It is separate from solve records, has
visible write errors and can be exported. It has no cross-tab merge: use one Play
tab for a given saved cube. M1's transactional repository and recovery journals
remain unchanged. Future sync must introduce a versioned checkpoint repository.

Virtual practice starts on the first face turn after a scramble and stops on a
logically solved cube. Leaving or hiding the page interrupts timing. Only the
cube is resumed after reload; this new timer does not persist attempt history
or mix virtual results into physical statistics. Historical simulator timing
and scores remain available in the original simulator.

## Build, offline and rollback

React and Vite build the new entry from `apps/web`; the existing Rollup build
still produces the original game and M1 timer. The vendored Three.js runtime is
shared through a narrow renderer boundary. Its classic-script bundling warning
is expected: the static export copies it at its existing URL. No CDN is needed.
Dependencies are pinned in the lockfile; use Node 22.12 or a supported newer runtime.

Hash routes `#/play` and `#/settings` work under the existing Pages subpath.
The worker precaches all three pages plus the Vite assets and keeps HTML/JS from
the same release. A waiting update asks you to close all open app tabs and reopen.
Do not clear browser storage to get an update. Rollback redeploys a prior verified
main commit's artifact and leaves every browser storage key intact. The preserved
`master` branch is not the production release branch.

```sh
npm ci
npm run check:architecture
npm test
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npm run preview
```

Local verification: 32 unit tests; 32 browser scenarios (18 Chromium, 7 Firefox,
7 WebKit). Chromium covers the complete retained-game/M1 suite and automated
accessibility scans; Firefox/WebKit cover the new shell and M1 compatibility.
Offline shell checks shut down an isolated origin server and reload cached pages.
This avoids a reproduced Windows WebKit internal error with the test tool's
offline toggle while still proving that uncached network access is unavailable.
The older Chromium offline-toggle regression remains in the suite.

GitHub Actions repeats these checks on Linux before deploying. Linux Firefox runs
with Xvfb and software rendering because the runner's headless Firefox could not
create a WebGL context. All canvas assertions remain enabled, and a separate
no-WebGL regression verifies recovery warnings and the text-cube fallback.
See [Playwright's headed CI setup](https://playwright.dev/docs/ci#running-headed).
The verification job allows 20 minutes for browser/system dependencies and tests;
the first three-engine installation took over seven minutes. The tests use
isolated profiles and synthetic solves; they do not inspect a user's saved data.
Actual Android/iPhone touch, suspend/resume, screen readers and native install
behavior need owner-device testing. Automated axe checks do not certify complete
WCAG compliance or lesson translation quality.

## Try the release

1. Open the live URL. If an old version remains, close all tabs for the app and
   reopen. Choose **Original simulator** to resume an existing original game.
2. In Play, click the cube panel and type J, I, F, K quickly. Four ordered moves
   should finish. Reload and confirm the move sequence remains.
3. Open Settings, choose a theme, enable face letters/reduced motion, and assign
   U to A. Save, return to Play, focus the cube and press A. Try Hindi and reload.
4. Export the cube, reset it after reviewing the dialog, then import the file.
   Its size, colors and move count should return.
5. Open Timer and confirm your existing sessions/history remain. Record a test
   solve, reload and export a timer backup. Delete the test solve through review
   if desired. Cube exports and timer backups are different formats.
6. Load the app online once, then disconnect and reload Play, Settings and Timer.
   Reconnect afterward. Report the device/browser and any failure.

Next command:

```text
Start M3 from our architecture plan. Add reviewed beginner lessons, manual cube-state entry and a verified 3x3 solver with step-by-step playback. Preserve M1/M2 data and the live URL, push each verified change to main, and verify deployment.
```
