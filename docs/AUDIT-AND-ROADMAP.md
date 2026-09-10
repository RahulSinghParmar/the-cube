# The Cube: repository audit and first release

Audit date: 2026-09-10. Baseline: `c030997621687f6410d4e9f12255e9701a1de9c7`.
Scope agreed for this pass: audit and implement the first improvements.

## Current product

The repository is a static JavaScript application using a vendored Three.js renderer, Rollup, Sass sources and committed CSS/JS assets. It already supports 2×2 through 5×5 cubes, mouse/touch manipulation, animated scrambling, a simulator timer, size-specific local scores, themes and saved games. Keyboard code exists but is not instantiated. There is no functioning web test suite, server application, account system or solver in the baseline.

The supplied CubeMaster AI vision is a product direction. Its proposed framework versions, service choices and statements about missing features should not be treated as a verified specification.

## Findings addressed in this release

| Finding | Change | Verification |
| --- | --- | --- |
| Keyboard module disconnected; no visible key guide | Enable the supplied twelve-key layout, XYZ rotations, Enter to start/resume, Escape to return, and an expandable guide | Unit checks plus real browser move/inverse and saved-state checks |
| Early start can race the delayed intro and leave the title over the timer | Include the initial delay in the transition input guard | Browser assertion that title letters are hidden during play; desktop/mobile screenshot inspection |
| Keyboard input could consume editing or browser shortcuts | Ignore composing text, editable/form controls, repeat events and browser modifier combinations; guard game state and scrambling | Unit regression tests |
| 4×4 and 5×5 outer-face notation creates half turns | Separate layer position from turn direction with `Math.sign(row)` | Quarter-turn and inverse assertions on sizes 2–5; double-turn expansion |
| Build assumes undeclared Rollup and Unix copy commands | Declare build dependencies, lock versions, minify the bundle, and copy the static output with Node | Successful build on Windows; Linux CI added |
| Several workers/register calls compete; precache contains directories and origin-root paths | One local worker, explicit app assets, project-relative manifest, scope-specific versioned cache | Chromium offline reload and subsequent keyboard gameplay at `/the-cube/` |
| Cached releases can mix old HTML and new JS | Cache the complete shell and fingerprint production assets during build; let updates activate after old tabs close | Build fingerprint and offline browser verification; upgrade rollout still needs staging validation |
| Score-history limit misspelled `lenght` | Retain the latest 100 times on the next save while preserving lifetime solve count, best and worst | Unit tests including oversized legacy history |
| Missing/invalid elapsed time resumes as NaN | Reject invalid and negative parsed times | Unit cases including zero-time resume |
| Icon buttons unnamed and invisible buttons focusable | Add accessible names, disable hidden buttons, restore focus outlines, set document language and allow zoom | Browser checks for labeled controls and mobile overflow |
| Inherited analytics runs on every visit | Remove the legacy tracking tag | Source inspection |
| Manifest contains unrelated demo screenshot and overly broad scope | Remove placeholder screenshot; make scope/start relative and avoid unverified maskable-icon claim | Manifest inspection and project-subpath browser test |

The existing storage version stays unchanged, so this release does not deliberately reset saved games or themes. Existing individual solve times remain as recorded. Score history is intentionally bounded to the original intended 100 entries when the next solve is saved; lifetime aggregates remain available.

## Remaining issues and limits

- The current statistics are arithmetic means of the last 5/12/25 solves, not competition-style trimmed averages. There are no +2/DNF penalties, inspection, independent physical-cube timer sessions or Ao100 yet.
- Full keyboard accessibility is unfinished: the custom preference/color sliders still need semantic roles and keyboard operation. These improvements do not establish WCAG compliance.
- The timer uses wall-clock time and writes synchronously to local storage. A monotonic timer and validated/versioned persistence are next. Malformed preferences or scores and storage denial/quota errors need comprehensive recovery.
- Face turns arriving during an animation are ignored. A bounded move queue with pointer/keyboard arbitration is needed for fast virtual speedcubing. Whole-cube orientation/notation semantics need a dedicated design and test suite.
- The renderer is an older vendored Three.js build. It must be isolated behind an adapter before any upgrade. Existing visual behavior and touch interactions need regression coverage during that work.
- Web tests currently cover Chromium, desktop and a mobile viewport. Actual Android/iOS installation, touch gestures, Safari/Firefox, service-worker migration from deployed legacy versions and offline upgrades need device/staging tests.
- The Android release workflow references missing build-project files and an unpinned third-party publishing action. It is retained for review; this release does not validate or publish Android artifacts.
- Follow-up on 10 September 2026: the foundation and an orientation-test correction were pushed to `codex/phase-one-foundation`; GitHub web checks passed at `3b8588e`. No live deployment changed. The [full architecture plan](architecture/README.md) expands the roadmap below.
- Original author credits remain. Licensing/provenance and old social metadata need review before rebranding or commercial release.
- No claims are made about 90% coverage, Lighthouse >95, scanner accuracy, solver completeness or production readiness of the full ecosystem.

## Product plan in dependency order

Primary first-release audience: people learning cube notation and practicing on a virtual cube. Next audience: physical-cube users who need a reliable practice timer. Validate retention and usefulness before funding community and native apps.

| Milestone | Work | Release gate |
| --- | --- | --- |
| 1A — current pass | Build repair, keyboard access, notation correction, offline shell, targeted tests | Local build/unit/browser checks pass |
| 1B — timing and data | Strict TypeScript domain modules; monotonic timer; separate simulator and physical-timer modes; inspection, penalties, sessions, trimmed averages, JSON export/import | Deterministic timing/statistics tests, migration fixtures, verified reload/recovery and keyboard/touch flows |
| 1C — accessible foundation | Semantic settings, focus management, reduced motion, high contrast, move queue, responsive layouts and offline update UI | Keyboard-only audit, supported browsers/devices, accessibility and performance measurements |
| 2 — learning and deterministic solving | Canonical cube state independent of Three.js; move parser; 3×3 state validation; worker-based solver; beginner notation and step playback | Legal-state fixtures, invalid-state rejection, every returned solution verified by applying it to the starting state |
| 3 — algorithm practice | Curated/licensed PLL, then OLL and F2L cases; case setup, inverse generation, recognition practice and local progress | Verified algorithms and independently reviewed lesson content |
| 4 — optional accounts and sync | Auth provider decision; profiles; authenticated session sync; deletion/export; locales; abuse controls before leaderboards | Authorization tests, conflict resolution, backup restoration and privacy review |
| 5 — camera assistance | 3×3 camera capture first; manual color correction; state validation; connect to deterministic solver | Lighting/device benchmark and explicit correction/retry flow; broader cube sizes are separate projects |
| 6 — coaching and distribution | Evidence-based training suggestions; optional AI explanations/voice; native packaging only after PWA usage validates demand | Coach evidence and cost controls; native installation/offline/device checks |

An LLM should not determine cube-state validity or be trusted to produce unverified solutions. Camera capture is a separate input path into the same validated state model. In-browser deterministic solving can work without accounts or AI API costs.

## Proposed architecture

Keep the current app while extracting tested modules incrementally. Avoid introducing Next.js, NestJS, Flutter and Tauri together in the foundation release. No backend is necessary for the first three local features.

```text
UI (simulator / timer / academy)
  -> application commands and session state
     -> cube core: moves, state, validation
     -> timing/statistics core: elapsed time, penalties, aggregates
     -> persistence adapter: local now, optional sync later
     -> solver worker: validated state -> verified moves
  -> Three.js renderer adapter
```

Move to a workspace structure when a second app actually shares the domain packages: `apps/web`, `packages/cube-core`, `packages/training`, `packages/storage`, then `apps/api` if account features are funded. Strict TypeScript should begin with these domain boundaries rather than permissive declarations covering the existing renderer.

Future data concepts: Session (id, puzzle, mode, createdAt), Solve (id, sessionId, scramble, elapsedMs, penalty, createdAt), AlgorithmCase (id, puzzle, method, setup, solution, provenance), Progress (caseId, attempts, recognitionMs), and optional Profile/User identity. Keep simulator results distinct from physical timer results. Define migrations and import validation before changing stored records. This is a conceptual model, not an implemented database schema/API.

## Next sprint

1. Write timer/penalty/session acceptance cases and agree on inspection behavior against current official rules.
2. Extract strict TypeScript timing/statistics modules with tests for DNF, ties, missing samples and penalty boundaries.
3. Add a separate physical-cube timer view with Space/touch hold-and-release controls and inspection option.
4. Introduce versioned sessions, safe persistence, JSON backup/import and migration of existing size-specific times.
5. Show last/best/mean/Ao5/Ao12/Ao100 with clear definitions; preserve existing simulator behavior.
6. Add end-to-end scenarios, keyboard accessibility checks and mobile-device validation before release.

## Deployment and rollback

Run `npm ci`, `npm test`, `npm run build` and `npm run test:e2e`; publish the complete `export/` artifact to an HTTPS static host. The web CI produces an artifact for review and does not deploy. Both the root path and a project subpath are supported by relative assets; the browser suite exercises `/the-cube/`.

Before releasing to current users, save the previous static artifact and back up representative local storage records through browser developer tools. Use a staging origin to rehearse an upgrade from the currently deployed worker, including closed/reopened tabs, offline reopen and persisted score/theme/cube data. Avoid changing `window.gameVersion` without an explicit migration: the inherited storage constructor clears saved games/preferences when it changes.

Publish HTML, JS, CSS and worker together. Serve the worker with revalidation/no-cache headers where the host permits. Updates intentionally wait for old tabs to close, avoiding mid-solve reloads. For rollback, restore the previous complete artifact; test that its worker installs and activates after old tabs close. Do not delete unrelated origin caches. Old generic legacy caches are left alone because their ownership is ambiguous; a targeted migration can follow staging inspection.

Observe startup errors, successful worker installation, load time, bundle size and successful resume/offline play during rollout. Add opt-in/product-appropriate telemetry only after choosing ownership and data collection requirements. Database backups and server health checks become release requirements when a backend is introduced.
