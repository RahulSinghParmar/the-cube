# P1: clear application sections

17 September 2026. P1 retains React and organizes existing features. It adds no
cloud service, dependency, storage migration or new cube renderer. The original
homepage remains at <https://rahulsinghparmar.github.io/the-cube/>.

## Navigation

| Section | Destination and available actions |
| --- | --- |
| Algorithms | `menu.html#/algorithms`: 12 beginner F2L setups, 57 OLL cases and 21 PLL cases, linking existing explanations/playback |
| Training | `menu.html#/training`: PLL recognition and saved F2L/OLL/PLL guided practice |
| Guides | `menu.html#/guides`: eight prepared beginner exercises, F2L introductions and manual solving |
| Solve | Existing `menu.html#/solve`: manual entry and independently verified solver |
| Practice | Existing `menu.html#/play`: button/keyboard cube with saved checkpoints |
| Timer | Existing `timer.html`: physical timing, sessions and backups |
| Statistics | `menu.html#/statistics`: physical session statistics, original trophy view, recognition history and guided progress |
| Settings | Existing `menu.html#/settings`: original touch-cube settings link and app preferences |

The original Play entry, About, License and collapsed keyboard help remain.
An expandable **All sections** menu connects sections without displaying all eight
links permanently. Existing trainer and lesson pages have a parent link. Browser
Back still works. Original `#/train`, `#/oll`, `#/f2l`, `#/recognize` and `#/learn`
bookmarks retain their meaning.

Original panels retain their typography, sliders, colors and cube rendering.
App links use `?panel=settings&return=settings` and
`?panel=stats&return=statistics`; their Back button returns to the app section.
Standalone `?panel=settings` and `?panel=stats` links still return to the cube.
Panel entry continues to skip the falling-cube entrance. Return destinations are
limited to these two local sections.

## Preservation and performance

The [v2 preservation inventory](17-platform-architecture.md) remains the contract.
No local storage key, IndexedDB store, backup format, catalog ID, solver protocol
or timer calculation changes. Physical, simulator and training results stay
separate. Statistics links to the existing records rather than duplicating them.

New CSS is scoped to section navigation/cards and reuses theme tokens. Cards use
three, two or one columns according to available width, with keyboard focus,
touch targets and reduced-motion support. Section labels include English/Hindi;
the existing learning content and new detailed introductions remain English.

The production menu JavaScript grows from 260,196 to 267,447 uncompressed bytes
(7,251 bytes, approximately 2.8%). Landing pages add no WebGL canvas or dependency.
The existing original-renderer density checks remain in the browser suite.
These size measurements are not a physical-device frame-rate benchmark.

## Verification

Type checking, all 55 unit tests, production build and architecture checks passed.
All 137 browser tests passed across Chromium, Firefox and WebKit. The new section
tests exercise 320, 820 and 1440-pixel widths and landscape layout, keyboard
dropdown use, focus after routing, old bookmarks and panel return paths.

Data checks retain exact practice checkpoints and learning/legacy records while
navigating and reloading offline, and retain a physical timer attempt. Existing
regressions cover actual guided playback, solver verification, restore/write
recovery, themes, original panels and service-worker updates. Automated
accessibility checks include all four new landing pages in the existing themes.
Built-in browser inspection supplements these checks. Real iPhone/iPad/Android
touch and installation checks remain owner device tests.

## Owner test: one short round

1. Open the homepage and choose Menu. Confirm the original cube still looks and
   behaves as before and that all eight sections appear in Menu.
2. Choose Algorithms → F2L, OLL or PLL. Try one playback step and check your saved
   progress. Use Training to return, then All sections → Guides → Beginner lessons.
3. Open Statistics → Cube statistics. Confirm the original trophy layout and
   values. Back should return to Statistics. Physical-cube statistics should open
   your selected timer session's statistics, with its existing history.
4. Open Settings → Open touch-cube settings. Confirm the original controls open
   directly. Back should return to app Settings. A standalone original panel
   bookmark should still return to the homepage cube.
5. Reload a trainer and the timer to confirm progress/history remain. After the
   app has loaded online, try an offline reload. Do not clear browser data. If an
   update is waiting, close app tabs and reopen to activate it.

P1 organizes existing content. A full algorithm catalog with favorites/variants,
a complete beginner first-solve course and expanded charts remain later phases.
P2 evaluates technology choices before any framework cutover; use the next prompt
in the [build guide](08-build-guide.md) when ready.
