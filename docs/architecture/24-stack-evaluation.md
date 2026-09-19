# P2B: measured stack and renderer decision

19 September 2026. **Keep React, the existing ThreeRenderer and the original simulator in production.** Continue to P3A on the shared foundation. No framework, renderer, storage, timer, theme or URL migration ships in this release.

## Decision and scope

The [isolated evaluation](../../experiments/stack-evaluation/README.md) contains a SvelteKit static site, a matched React/Vite player, a cubing.js candidate and a Bits UI/Tailwind/Lucide dialog. Both matched players use the same TypeScript cube core, controller, renderer, geometry, sequence and existing theme. They support 2×2–5×5, stepping, reverse, seeking, speed, play/pause and reduced motion. They intentionally omit the production application's lesson credit, persistence and complete navigation; their size cannot be extrapolated to a full migration.

Svelte reduces the matched player's loading size. This experiment does not establish a material improvement in 3D animation or justify rewriting the verified routes, practice rules and offline lifecycle. Retaining React also retains the existing regression coverage while the catalog and complete courses are built. SvelteKit remains technically feasible for static hosting through [adapter-static](https://svelte.dev/docs/kit/adapter-static); no server or Coolify instance is required for this prototype.

## Measurements

The committed [measurement record](p2b-measurements.json) contains raw samples, response sizes, browser checks, renderer samples, notation probes, offline preservation and capability detection. See that file for exact versions and host details. The table below is generated from the final run.

<!-- MEASUREMENTS -->
| Route | Raw KiB | Estimated gzip KiB | Median ready ms | Requests |
| --- | ---: | ---: | ---: | ---: |
| Matched SvelteKit + retained renderer | 678.9 | 201.5 | 110 | 14 |
| Matched React + retained renderer | 806.6 | 233.3 | 130 | 6 |
| SvelteKit + cubing.js (initial 3×3) | 804.7 | 236.8 | 141 | 16 |
| SvelteKit + Bits/Tailwind/Lucide dialog | 180.9 | 75.9 | 52 | 14 |
| Full production React explorer (context only) | 877.5 | 256.9 | 415 | 7 |

| Framework / size | Median frame gap ms | p95 frame gap ms |
| --- | ---: | ---: |
| svelte / 2×2 | 16.7 | 16.7 |
| svelte / 3×3 | 16.7 | 16.8 |
| svelte / 4×4 | 16.7 | 16.8 |
| svelte / 5×5 | 16.7 | 16.8 |
| react / 2×2 | 16.7 | 16.7 |
| react / 3×3 | 16.7 | 16.7 |
| react / 4×4 | 16.7 | 16.8 |
| react / 5×5 | 16.7 | 16.7 |
<!-- END MEASUREMENTS -->

Five fresh Chromium contexts per route, localhost, no CPU/network throttling, service workers blocked for load samples. Ready time is a browser-side timestamp after controls/state and a nonzero canvas are present, not an interaction polling delay. Component-ready waits for the dialog trigger to be enabled after hydration. Gzip totals are computed per observed response body; the local server serves uncompressed responses, so these are compression estimates rather than measured GitHub CDN transfer. Font/theme bytes are included. Full-app figures provide context only: it performs work the small prototypes omit.

Frame samples use a requestAnimationFrame observer during ten forward/back turns per size, with the same 320 ms animation duration. Click-to-commit includes test-protocol and rendering time; it is not field INP. Candidate cubing.js runs its own four-move timing, so its elapsed time is not a like-for-like speed ranking. Browser scheduling gaps do not measure physical phone GPU throughput. Timing samples are observations, not stable CI thresholds.

In Chromium, candidate playback completed its nominal four-second sequence in approximately 4.06–4.11 seconds across 2×2–5×5, with p95 frame gaps around 16.7–16.8 ms. Visiting 2×2 after the initial 3×3 load fetched about 276 KiB estimated gzip in total; 4×4/5×5 visits fetched about 258 KiB. Those cumulative figures include the initial puzzle and dynamic imports, not isolated cold-load sizes for each target puzzle.

## What the checks establish

- Matched Svelte and React players: each size separately checked against shared-core snapshots for forward, reverse and final seek; reduced motion; 320/820/1440 px overflow; automated axe checks in Chromium, Firefox and WebKit.
- Built-in browser inspection covered both matched players, the candidate renderer and keyboard dialog controls. It caught a client-navigation script-loading race in the Svelte prototype; initialization now waits for the retained renderer script. A navigation regression check runs in all three automated browser engines.
- Component trial: keyboard opening, focus containment, Escape and return to the trigger; automated axe. WebKit pointer clicks do not establish keyboard focus on the trigger, so keyboard return is tested from a keyboard-opened dialog. This is not a VoiceOver/NVDA qualification.
- cubing.js: 2×2–5×5 rendering and reverse-to-initial-pattern in supported test engines. This does not prove interchangeability with our facelet/checkpoint schema. Closed shadow content and third-party renderer lifecycle need additional qualification. The candidate's manual seek counter deliberately does not track native autoplay; production explanation synchronization is not implemented in it.
- The Windows headless Firefox candidate failed WebGL2 creation (`AllowWebgl2:false`), while the retained renderer worked in the same engine. This is an environment-specific failure, not a claim about every Firefox device. It blocks a universal replacement recommendation until real Firefox/WebGL2 and fallback behavior are qualified.
- A fresh disposable profile created a real physical timer solve and saved a lesson position. Those survived prototype visits, reload, offline operation and a generated-worker upgrade. The upgrade waited for open evaluation clients and retained production caches. The root, original settings/statistics, legacy, menu/player and timer URLs remained available offline. No live user records were used by the automated tests.
- The production build excludes `experiments/`; root dependencies and build inputs are unchanged. The existing service worker intentionally maps unknown navigation to the original homepage. A future path-based migration must change this contract deliberately: dropping Svelte files under the current root worker would not be sufficient. The experiment's worker owns only `/the-cube/evaluation/`, on a local origin.

## Technology choices

| Candidate | Evidence and recommendation |
| --- | --- |
| React + current ThreeRenderer | Keep for production. Existing player/persistence coverage remains valuable. The vendored Three runtime is revision 95, so a future modern-Three adapter deserves its own visual/resource/fallback test; changing frameworks is not a prerequisite. |
| Svelte 5.57.1 / SvelteKit 2.70.3 / static adapter 3.0.10 | Static prototype works and is smaller in this slice. Keep as evaluation only. Kit's declared TypeScript peer range currently ends at 6, while production uses 7; the prototype pins TypeScript 6.0.2 in a separate lockfile. No shared dependency downgrade. |
| cubing.js 0.63.6 | Useful future engine/notation candidate for broader puzzles, groups and commutators. Keep behind a prospective adapter. Test notation, orientation, saved-state conversion, captions, hidden-player pause, resource disposal, fallback and appearance before replacing any production renderer. It brings its own modern Three rendering; loading both engines on one route should be avoided. |
| Tailwind 4.3.3 | Trial compiles a small utility stylesheet without preflight/global reset. Existing CSS variables remain authoritative. No evidence here justifies rewriting the established stylesheet; adopt selectively only if it reduces maintenance for a concrete feature. |
| Bits UI 2.19.2 | The dialog trial demonstrates accessible behavior with our styling. It is Svelte-specific and does not belong in the React production bundle. Keep native controls/current components where sufficient. |
| shadcn-svelte | Reviewed as editable component source built on primitives, not a separate runtime to install wholesale. The trial exercises its underlying Bits/Tailwind approach, not a full shadcn-generated application. A future adoption needs selected-component ownership and theme review. See [upstream architecture](https://www.shadcn-svelte.com/docs). |
| Lucide | Trial uses one tree-shaken `@lucide/svelte` 1.47.0 icon with a visible text label. `lucide-svelte` is deprecated in npm. Keep existing production icons; use the maintained framework-specific package for a future need. [Upstream guide](https://lucide.dev/guide/svelte). |
| sr-visualizer 1.0.13 | **Not used.** npm reports ISC, but its actual archive contains GPL COPYING and LGPL COPYING.LESSER and identifies its VisualCube derivation. [The upstream repository](https://github.com/tdecker91/visualcube) exposes those licenses. Do not infer ISC permission from registry metadata. Resolve provenance/terms with the maintainer or choose another diagram renderer before reuse. |

Cubing.js was evaluated without source modifications under MPL-2.0, with its pinned source/license linked in the prototype README. Any distributed integration must preserve notices and source availability for covered code; see the [upstream license](https://github.com/cubing/cubing.js/blob/61d8e623795a488bda32172f7298fd02741ae2bc/LICENSE-MPL.md). The prototype is source-only in this repository; its built bundles are not published. Six low audit findings in the isolated dependency tree trace to SvelteKit's cookie dependency; there are no cookie/auth server endpoints here. Track a compatible fix before adoption rather than accepting the audit's suggested ancient framework downgrade. Production dependencies are unaffected.

Notation probes establish capability, not full equivalence. For example, cubing.js accepts `[R,U]` and `(R U)3` on the tested sizes, but its 2×2 model rejects `Rw`, which our core accepts as a whole-width turn. The existing checkpoint dialect must remain explicit. Inverse round trips alone do not validate a cross-engine adapter.

## Browser and native Bluetooth feasibility

| Target | Feasible path and limits |
| --- | --- |
| Chrome/Edge desktop and supported Android Chrome | Web Bluetooth with HTTPS, feature detection and an explicit user gesture/device chooser. Actual OS/adapter/model support must be tested. Headless API presence is not proof of pairing. |
| Firefox and Safari, including ordinary iPhone/iPad Safari | Do not promise direct Web Bluetooth. Preserve manual/virtual practice. Recheck vendor support at P7/P9; a UI framework or backend cannot supply the missing browser API. |
| Native iOS/Android | Evaluate a Capacitor BLE transport independently of Web Bluetooth. The community plugin provides scanning/GATT/notifications, not GAN protocol decoding. iOS needs Bluetooth usage text and real hardware; background modes only if the feature requires them. Native permission, suspend/resume and data-store behavior are separate gates. |
| Desktop native packaging | Retain the web UI/domain modules; select and qualify an OS BLE bridge per platform. A WebView wrapper alone is not a tested transport. |

[Web Bluetooth implementation status](https://raw.githubusercontent.com/WebBluetoothCG/web-bluetooth/main/implementation-status.md) and [MDN security requirements](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) support the browser boundary. [Capacitor BLE documentation](https://github.com/capacitor-community/bluetooth-le) documents native setup and the lack of iOS simulator Bluetooth.

`gan-web-bluetooth` 3.0.2 (MIT) exposes move/facelet events and timer events for listed GAN generations. Its list includes one MoYu model using GAN's Gen2 protocol; that does not qualify general MoYu or QiYi support. Its timing guidance accounts for cube/host clock skew. Preserve both timestamps and event ordering, verify facelet resynchronization, and keep brand protocols separate behind the shared device contract. [Upstream supported devices and timing guidance](https://github.com/afedotov/gan-web-bluetooth). The native route still needs protocol/crypto/identity transport separation; the browser package is not proven drop-in native code. No hardware was paired in P2B.

## Remaining physical qualification and next step

Real iPhone/iPad Safari, Android phones including a low-end device, touch dragging, thermal/battery behavior, screen readers, background/lock recovery, WebGL context loss, install/update behavior and smart-cube permission/reconnection/timestamp accuracy remain unverified. Test supported cube models individually; do not extrapolate from a simulator, browser capability flag or brand name.

P2B's decision is complete: **no cutover**. Revisit a migration only when a measured device budget or required capability cannot be met with the current adapters, and require route/data/offline parity before rollout. Next is **P3A: unify existing PLL/OLL/F2L catalog data, favorites, variants, learning ratings and notation preferences**, retaining React and stable progress IDs. No new migration is a prerequisite for that work.
