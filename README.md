<h1 align="center">
  <br>
  <a href="https://github.com/rahulsinghparmar/the-cube/">
  <img src="https://lh3.googleusercontent.com/-PvHGr9rLu8o/YMRbRFUtMzI/AAAAAAAAiBw/KYMXz2gepkggi2Jcy0EvHBkoD2KI8_hIACLcBGAsYHQ/w200-h200/icon.png"
  alt="the-cube" width=150>
  </a><br>
  The Cube
  <br>
</h1>  

## installation

### Local development

Requires Node.js 22.12 or a compatible supported newer runtime.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173/the-cube/. `npm run dev` builds once and serves the
static output; rerun `npm run build` after source changes. `npm run build` produces
`export/` for static hosting, including the versioned offline worker.

```sh
npm test
npx playwright install --with-deps chromium firefox webkit
npm run build
npm run test:e2e
```

The browser suite checks cube turns, physical timer input/inspection, sessions,
backup/import, interrupted and failed-save recovery, saved-game resume, mobile
layout and offline gameplay. Successful pushes to the primary `main` branch
publish the tested site to [GitHub Pages](https://rahulsinghparmar.github.io/the-cube/).
The `master` branch preserves the original base. Pull requests run checks without publishing.

### Keyboard controls

The homepage uses the original full-screen touch cube: double tap or press Enter
to start/resume, swipe to turn, and use Escape to return. **Menu → Practice** opens
the newer button/keyboard cube; focus its panel to use the keys below and change
its twelve bindings in Settings.

| Keys | Moves |
| --- | --- |
| J / F | U / U′ |
| I / K | R / R′ |
| D / E | L / L′ |
| H / G | F / F′ |
| W / O | B / B′ |
| S / L | D / D′ |

Use X/Y/Z for whole-cube rotations, with Shift to reverse. A prime (′) means a
counterclockwise turn when looking at that face. The simulator timer starts on
the first face turn after scrambling and stops when solved. Practice queues up to
32 moves during animation; the original simulator retains its previous input
behavior. An expandable guide is available in the app.

### Homepage, menu and practice

The homepage keeps the original cube layout and gestures, its **trophy** and **preferences** controls, and a **Menu** button.
The menu holds Play, Practice, Timer, Settings, License and About the Developer,
plus original cube statistics and collapsed keyboard help. The menu uses the original display font, cube colors, and a compact layout for phones, tablets, and desktop.

**Menu → Practice** uses an exact typed cube engine, a responsive React interface and
reviewed cube backup/import. Settings include custom keys, light/dark/high-contrast
themes, reduced motion, face letters and English/Hindi foundations. Dragging the
new cube changes the view; buttons and keys turn faces. New cube checkpoints
resume after reload. Virtual attempt history remains in the original simulator.

The original saved game resumes on the homepage. M1 timer
sessions and storage are preserved at the same URL. Offline use works after an
initial online load. Close all app tabs and reopen when an update is waiting;
do not clear saved browser data. See [M2 release and testing notes](docs/architecture/10-m2-release.md)
for the implemented scope and state convention. See [the homepage refinement](docs/architecture/11-home-and-menu.md)
for current navigation and testing steps.

### Physical cube practice (M1)

Open the [practice timer](https://rahulsinghparmar.github.io/the-cube/timer.html)
or choose **Menu → Timer**. Focus the timer pad, hold Space
until ready, release to start, then press to stop. Touch uses the same gesture;
**Start without holding** provides a native-button alternative. Enable inspection
to inspect before the start gesture. Results save locally with sessions, reviewable
penalties, DNF, personal best and trimmed Ao5/Ao12/Ao100 statistics.

Export a backup regularly. Import validates and previews the file before writing;
conflicts leave existing history untouched. Old simulator scores are imported once
into separate archive sessions, retaining their original data. Switching apps or
reloading during a solve records an interruption instead of a competitive time.
See [M1 release and testing notes](docs/architecture/09-m1-release.md) for recovery,
browser requirements and known limits.

See [the audit and phased roadmap](docs/AUDIT-AND-ROADMAP.md) for findings,
remaining limitations, the next sprint and deployment/rollback instructions.

The [full architecture plan](docs/architecture/README.md) covers product scope,
module boundaries, data/sync design, PostgreSQL and OpenAPI drafts, UX,
security, deployment and the implementation backlog. Follow the
[commit-and-push workflow](CONTRIBUTING.md) for changes.

For a nontechnical overview, see [the build phases and copy-paste commands](docs/architecture/08-build-guide.md).

### Install the web app

- [Click](https://rahulsinghparmar.github.io/the-cube/) here to visit the Page
- add the application into YourHome Screen.
- that's It, Enjoy the Game.

## 🕹️ Features

- Fully offline gameplay.
- No ads are implemented in it.
- Simple and minimal UI experience.
- Compete with your friends & family.
- Easily evaluate the speed of your moves.

## 🛠️ Compatibility

The web suite runs in Chromium, Firefox and WebKit, including a 320-pixel layout
and offline reloads. Real Android/iPhone installation, touch and suspend behavior
still require device checks; see the M1/M2 release notes. The legacy Android
wrapper has not been updated or requalified by these web milestones.
