# Local technology evaluation

P2B comparison harness. This directory is deliberately outside `apps/*` and `packages/*` workspaces. It is not imported, built, precached or deployed by the production build. The production React dependencies, theme, storage and routes stay unchanged.

Run from the repository root first:

```powershell
npm.cmd ci
npm.cmd run build
Set-Location experiments/stack-evaluation
npm.cmd ci --cache ../../.npm-cache
npm.cmd run build
npm.cmd run preview
```

In another terminal in this directory:

```powershell
# Use the repository's existing browser directory on Windows, if installed there.
$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path ../../.playwright).Path
npm.cmd run measure
node preservation.mjs
node notation.mjs
node renderer-probe.mjs
node capabilities.mjs
```

Otherwise install the root Playwright version's Chromium, Firefox and WebKit using `npx playwright install` from the repository root. The harness uses root Playwright/axe and the compiled shared cube core. The server binds only to loopback, port 4175. Test engines sequentially; avoid other workloads during timing runs. On Linux, Firefox WebGL needs the same Xvfb/Mesa setup as the production workflow.

Open http://127.0.0.1:4175/the-cube/evaluation/ in the built-in browser. Compare Svelte, matched React, cubing.js and the component trial through the links. Production pages are served from the existing `export/` on the same local origin for preservation testing. Avoid first opening production on this origin: its existing worker intentionally serves the original homepage for unknown paths. The preservation test installs the narrower evaluation scope before opening production. A real migration must resolve this route/worker contract explicitly.

The matched players share the exact controller, TypeScript model, ThreeRenderer, sequence, theme and geometry. They are smaller than the production explorer: no lesson credit, saved inputs, manual exercise, loop or full application navigation. Comparing either to the full app is contextual, not a framework-only performance claim. React is a minimal Vite client, SvelteKit includes its router/SSR hydration. Cubing.js is a separate candidate, not an equivalent implementation: seek state is shown; autoplay captions, semantic state conversion, exact appearance and renderer cleanup parity are not qualified.

`measure.mjs` produces cold-load response sizes, estimated gzip, browser-ready timing, three-engine correctness/accessibility checks and full-motion frame-gap samples. Results are in ignored `results/`; `--qualify` reuses previous load results for debugging, so use a full run for recorded evidence. `preservation.mjs` uses a fresh disposable browser profile, generates a real timer solve and lesson position, tests offline routes, and upgrades only the generated evaluation worker before restoring its bytes. It does not touch the built-in browser's data.

Third-party dependencies are pinned in this directory's lockfile. Svelte/SvelteKit/Bits UI/Tailwind are MIT; React is MIT; Lucide is ISC. Cubing.js is used under MPL-2.0, without modifying its source; source for version 0.63.6 is [commit 61d8e62](https://github.com/cubing/cubing.js/tree/61d8e623795a488bda32172f7298fd02741ae2bc) and the [license](https://github.com/cubing/cubing.js/blob/61d8e623795a488bda32172f7298fd02741ae2bc/LICENSE-MPL.md) applies. Preserve its notices/source access if distributing a compiled candidate. Existing theme/font/Three assets are copied only into ignored build input; retain repository attribution. No sr-visualizer code is used or distributed.

The isolated install currently reports six low findings through SvelteKit's cookie dependency (GHSA-pxg6-pf52-xh8x). This static evaluation has no server cookie/authentication endpoints. Do not apply the audit's suggested downgrade to old framework versions; reassess compatible fixes before any adoption. Production dependencies are unaffected.
