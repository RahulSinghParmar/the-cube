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

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173/the-cube/. `npm run dev` builds once and serves the
static output; rerun `npm run build` after source changes. `npm run build` produces
`export/` for static hosting, including the versioned offline worker.

```sh
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

The browser suite checks cube turns, timer startup, saved-game resume, mobile
layout and offline gameplay. The GitHub web workflow runs checks and uploads a
site artifact without publishing it.

### Keyboard controls

Press **Enter** to start/resume and **Escape** to return. Face turns use:

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
the first face turn and stops when solved. Input during a turn animation is
ignored. An expandable guide is available in the app.

See [the audit and phased roadmap](docs/AUDIT-AND-ROADMAP.md) for findings,
remaining limitations, the next sprint and deployment/rollback instructions.

The [full architecture plan](docs/architecture/README.md) covers product scope,
module boundaries, data/sync design, PostgreSQL and OpenAPI drafts, UX,
security, deployment and the implementation backlog. Follow the
[commit-and-push workflow](CONTRIBUTING.md) for changes.

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

Any android version from Android 9.0 or above are compatible with this app.
<br>Android 12 support is also introduced with the initial beta release.
