# Original touch homepage and a separate menu

This owner-requested M2 refinement comes before M3. The original simulator is
again the homepage at https://rahulsinghparmar.github.io/the-cube/. The root keeps
the original full-screen cube, double-tap start and swipe gestures. The original
trophy and preferences controls are restored at the bottom, with Menu in the top
corner. Keyboard instructions remain hidden in the menu rather than overlaying
the simulator. M3 remains paused while the owner reviews this foundation.

## Navigation

| Destination | URL | Behavior |
| --- | --- | --- |
| Play / homepage | `./` | Original touch cube and original saved game |
| Menu | `menu.html` | Play, Practice, Timer, Settings, License and About the Developer |
| Practice | `menu.html#/play` | M2 exact cube engine, queued moves, custom keys and cube backups |
| Timer | `timer.html` | M1 physical timer, sessions, statistics and timer backups |
| Settings | `menu.html#/settings` | Practice/menu preferences and a link to original touch-cube settings |
| Original cube settings | `./?panel=settings` | Original size, colors, turn animation and camera controls |
| Original cube statistics | `./?panel=stats` | Original simulator scores |
| License / developer | `menu.html#/license`, `menu.html#/about` | Project metadata and retained original creator acknowledgements |

The `legacy.html` entry remains compatible. Old root `#/settings` bookmarks
redirect to the new settings route. Root `#/play` now shows the touch homepage,
as requested. The installable app still opens `./`.

## Preservation and controls

No storage schema, namespace or version changes are made. Original `theCube_*`
keys, the M2 checkpoint/preferences keys and M1 IndexedDB all retain their names.
Menu waits for a turn, scramble or transition to finish before leaving the touch
cube. An active game is saved at that stable point; save failure keeps the page
open with an error. The new practice cube retains its existing queue guard.

The homepage uses the original fixed keyboard bindings. Custom bindings, themes,
face letters and reduced motion on the newer screen apply to Practice/menu.
Settings makes this distinction visible and links to the original cube controls.
The two cube states and timer history are not silently converted or combined.

The license page reports the existing ISC package declaration, the absence of a
repository-wide LICENSE file, and original/third-party credits. It does not add a
new license or grant rights for work whose provenance has not been reviewed.
About the Developer identifies Rahul Singh Parmar as this edition's maintainer
and preserves the original simulator's Boris Sehovac credit.

## Application design refinement

The menu uses the original locally bundled Bungee display face, neutral surfaces
and familiar cube colors. A compact Play action, a two-column tool grid and small
information links replace the previous tall website cards. At desktop and tablet
widths, the title and decorative cube sit alongside the tools. Phones stack a
compact title/cube above the launcher. Landscape remains scrollable. Every menu
action has at least a 44-pixel touch target and visible keyboard focus.

A CSS 3D cube provides depth without starting an additional WebGL renderer. Its
entrance runs once; hover/press feedback uses short transforms. System reduced
motion and the saved menu preference disable those effects. The simulator retains
its original animation and theme controls. The shared stylesheet carries the
neutral palette, typography and button shapes through Practice, Settings,
information pages and the physical timer. No remote fonts or media are fetched.

The trophy uses the original score calculations and stored results, including
best time and averages of 5, 12 and 25. It now has an explicit Back button, including
after completing a solve. Buttons become interactive only after the current
transition finishes, preventing taps from being silently discarded. Physical
timer statistics keep their separate rules.
The original preferences still include size, flip type, scramble length, camera,
color scheme and theme editing. No defaults or saved preferences are reset.

Keyboard help is collapsed inside Menu. Practice face buttons remain available
for touch and the non-WebGL fallback, but no longer show keyboard binding badges.
Key remapping in Settings is collapsed until requested. The timer keeps its short
hold/release prompt and accessible instructions; the detailed keyboard guide is
in Menu.

Browser checks cover 320/390-pixel phones, 820-pixel portrait tablets, 1024-pixel
landscape tablets, desktop and phone landscape. Chromium, Firefox and WebKit verify
the launcher, reduced motion, original preferences and original-format saved score
averages. These checks support the web app foundation; native app packaging and
physical iPhone/iPad/desktop qualification remain future work.

## Build and offline

Vite now builds `menu.html`. The static exporter copies the original homepage,
the retained legacy entry and Timer, then adds the compiled menu. The versioned
worker caches all four documents and resolves each document independently under
the Pages subpath. No server rewrite or hosting change is needed.

Each worker installation requests fresh HTML/assets with `cache: 'reload'`.
Live upgrade verification exposed that a still-fresh browser HTTP response could
otherwise populate the new offline cache with the previous homepage. A regression
with a one-hour HTTP cache lifetime reproduces that failure and verifies the fix.

After a release, finish the current solve, close app tabs and reopen to activate
the waiting worker. Do not clear browser storage. A previous release artifact
can be redeployed without changing saved records.

## Verification and owner testing

The suite contains 32 unit tests and 41 browser scenarios. It checks the retained
M1/M2 journeys, offline navigation, all menu destinations, original settings,
old settings bookmarks, automated accessibility on all new menu pages, and a
Chromium touch swipe followed by Menu → Play with the same saved cube. Browser
emulation does not replace testing on an actual phone.

```sh
npm test
npm run build
npm run check:architecture
npm run test:e2e
```

1. Finish any solve, close old app tabs and open the main URL. Expect the original
   full-screen cube, trophy, preferences and Menu. Double tap to start, then swipe
   a face. Open the trophy to check best times and averages; use Back to return.
2. Tap Menu, then Play. Start/resume and confirm the same cube is still there.
3. From Menu, try Practice, Timer and Settings. Confirm existing practice cube
   checkpoints and timer sessions remain; the exports retain their separate formats.
4. Open touch-cube settings and cube statistics from Menu. Visit License and
   About the Developer, then return to Play.
5. Load once online, disconnect and try reopening Home, Menu, Practice and Timer.
   Check portrait/landscape gestures and the menu touch targets on your phone.
6. Open the collapsed help inside Menu. Confirm keyboard instructions are absent
   from both simulator entries and that practice key remapping still works under
   Settings → Keyboard shortcuts. Try reduced motion and the alternate themes.

Next owner command, after trying the layout:

```text
The homepage and menu layout are approved. Start M3 from our architecture plan, preserving the touch homepage, saved data and live URL.
```
