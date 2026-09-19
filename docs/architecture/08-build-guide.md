# Build guide v2: phases and copy-paste prompts

16 September 2026. These are messages to paste into the development conversation, **not terminal commands**. Send one phase at a time. See [architecture v2](17-platform-architecture.md), [reference review](18-reference-review.md) and [delivery gates](07-delivery.md).

## Current position

The owner's request now covers the whole reference product. Start with
[the 99-capability audit, expanded releases and continuation prompts](21-product-coverage.md)
and [its inventory](reference-coverage.json). These supersede the earlier
3×3-first recommendation and narrow GAN-only/selected-puzzle scope below.
P1A adds [search for current tools](22-search-release.md).
P2A adds [shared multi-puzzle capabilities and playback](23-playback-release.md)
on React. [P2B evaluation](24-stack-evaluation.md) retains React and the current renderer. Next is P3A catalog work. These are implementation
steps toward full scope, not a claim that the reference has been reproduced.

The original simulator remains at [the live URL](https://rahulsinghparmar.github.io/the-cube/). M0–M3 web scope and M4's PLL, PLL recognition, OLL and 12 beginner F2L setups are implemented. Accounts, GAN connectivity, camera capture and qualified native apps are not implemented. The F2L release is recorded at commit `18e6f1e` in [its release notes](16-m4-f2l-release.md).

P0 is complete. P1 organizes the eight sections on React, with original-panel return links and preserved bookmarks/data. See [P1 release notes and device tests](19-p1-release.md). P2A/P2B are complete; P3A is next when authorized. Previous milestone names remain historical; P0–P10 incorporate the additional requirements without rebuilding completed work.

The owner's tutorial reference is now specified in [the tutorial experience plan](20-tutorial-experience.md).
It defines closely matched lesson layout and playback, then complete courses for
3×3, 2×2, 4×4 and 5×5. P4A can be selected before P2 to prioritize learning on
React; its implementation prompt is in that document. This specification adds
requirements; the full courses are not implemented yet.

## Overall build prompt

Use this when starting a new development conversation or restating the full direction.

```text
Work on RahulSinghParmar/the-cube using docs/architecture/17-platform-architecture.md,
21-product-coverage.md, reference-coverage.json, 18-reference-review.md,
07-delivery.md and 08-build-guide.md. Inspect the repository,
current phase, unfinished changes and latest deployment first. Continue the first
authorized unfinished phase; if none remains, report the next phase prompt
and wait for its authorization.

Keep the original homepage simulator, theme, 3D appearance, settings and statistics.
Organize the tools into Algorithms, Training, Guides, Solve, Practice, Timer,
Statistics and Settings, with About and Licenses. Preserve existing features,
saved data, backups, bookmarks and the live URL. Design for beginners through
competitors and for phones, tablets and desktop.

Reuse the TypeScript cube, timing, solver, training and data modules. Keep React
for P1. Evaluate SvelteKit, cubing.js and the requested UI libraries through P2
before any framework cutover. Use libraries only for their documented roles.
Plan GAN web/native adapters, optional Supabase sync, Capacitor mobile and Tauri
desktop with honest capability limits. Keep guest practice and downloaded core
content usable offline.

Implement one bounded, reviewable outcome at a time. Verify correctness, data
preservation, accessibility, performance and relevant browser behavior. Use the
built-in browser for UI review. Commit and push each coherent verified change
to main, preserve master and neutral naming, inspect matching CI/Pages results
and test live routes. Do not buy services or publish native store releases
without the required owner decisions.

After each release explain changes, checks/limits, commit/live status, my test
steps, remaining work and the next command. Stop at the named phase boundary
unless I authorize the next phase.
```

## Phase prompts

The preservation, verification and publication rules above apply to every implementation prompt. Preparation can proceed while hardware/provider choices are pending; report the exact remaining dependency.

### P1 — Organize the app (implemented)

```text
Start P1 from our v2 architecture. Create clear sections for Algorithms, Training,
Guides, Solve, Practice, Timer, Statistics and Settings, linking existing features.
Keep About and Licenses. Preserve the original homepage cube, original settings
and statistics panels, theme, 3D quality, saved data and old URLs. Keep keyboard
help hidden until requested. Make navigation clear on desktop, iPad and phones,
with direct original-panel links and useful back navigation. Stay on React;
do not migrate storage or add cloud/Bluetooth yet. Test in the built-in browser
and relevant regression suite, push verified changes to main, verify deployment
and explain my tests.
```

### P2B — Prove the technology choices (completed; retain React)

```text
Start P2. Compare our existing interface with a small SvelteKit static prototype
using the original theme and shared TypeScript modules. Evaluate cubing.js,
Tailwind, shadcn-svelte/Bits UI and Lucide for their proposed roles. Resolve
sr-visualizer licensing before use. Measure size, interaction, accessibility,
playback, saved data, old URLs and offline upgrades. Investigate GAN web/native
BLE feasibility and label missing hardware evidence. Record a keep-or-migrate
recommendation; keep the live framework until selection is recorded. Qualify
any selected migration route by route, separate from storage/timer changes.
Push verified work and report the evidence.
```

### P3 — Build the algorithm library

```text
Start P3. Build a searchable algorithm library with diagrams, recognition cues,
beginner-friendly explanations, variants, favorites and source notes. Reuse our
PLL/OLL/F2L content and stable progress IDs. Expand F2L in verified batches toward
the declared full taxonomy. Check independent case fixtures, stage outcomes,
orientation and AUF, not only an algorithm against its inverse. Add controllable
3D playback and guided-practice links. Preserve data/theme, test, push verified
changes and verify deployment.
```

### P4 — Complete the beginner learning path

Deliver as P4A (3×3), P4B (2×2), P4C (4×4), P4D (5×5), then P4E (faster-solving
bridges), following [the tutorial specification](20-tutorial-experience.md).
Select one course release per implementation pass. P4A uses existing domain
modules and does not require the expanded P3 catalog or a framework migration.

```text
Start P4. Expand Guides into an original, reviewed beginner-to-CFOP path: holding
and orientation, notation, first solve, intuitive F2L and two-look last layer.
Give each step a goal, short explanation, controllable 3D example, learner check,
mistake recovery and saved resume position. Distinguish prepared examples from
solving an arbitrary real cube. Preserve lessons/progress, support offline and
reduced motion, test and publish verified work.
```

### P5 — Expand training and saved review

```text
Start P5. Expand OLL/F2L recognition and guided execution alongside existing PLL
drills. Add selected/mixed case practice, optional timing, clear feedback,
weak-case review and saved spaced-review scheduling. Distinguish recognition
accuracy, watched examples and completed execution. Verify coverage, interruptions,
scheduling and data recovery. Preserve theme/history, test in the built-in browser,
push verified changes and verify deployment.
```

### P6 — Improve timer and statistics

```text
Start P6. Improve Timer and Statistics while preserving the tested engine,
sessions, penalties, original simulator statistics and backups. Add trends,
distributions, filters and accessible chart/table views with Chart.js where
justified. Keep physical, virtual and training results separate. Recheck official
rules before changing practice profiles; do not claim competition certification.
Test calculations, device input, large histories and saved data, then push and
verify deployment.
```

### P7 — Connect a GAN cube in supported browsers

```text
Start P7. Add GAN connectivity through SmartCubePort and gan-web-bluetooth for
supported browsers. Include connection guidance, state synchronization, validated
moves, disconnect recovery and manual fallback. Preserve host/device timing
evidence and detect duplicate/missing events. Integrate training/timer flows.
Ask for my exact cube model when hardware qualification needs it. Do not claim
Firefox/Safari/native support from mocked tests. Push verified changes, verify
deployment and provide a real-device test checklist.
```

### P8 — Optional account and cross-device history

```text
Start P8. Prepare Supabase region, auth, costs, backup and deletion choices,
then implement optional accounts/sync in stages once needed choices are settled.
Start with sessions/solves, then learning/training. Preserve offline guests and
require explicit guest linking. Follow v2 auth decisions and update the old API
draft first. Test ownership/RLS, concurrent edits, retries, conflicts, restore
and sign-out. Do not purchase services. Push verified work and verify live flows.
```

### P9 — Native mobile and desktop beta

```text
Start P9. Prepare Capacitor mobile and Tauri desktop builds with our shared app
and platform adapters. Begin with an offline guest beta and explicit browser
backup transfer. Qualify installation, updates, storage, lifecycle, input and
each claimed native BLE/camera feature on real target devices. Report missing
signing/toolchain/device requirements precisely. Preserve the web URL and data;
push verified work. Do not publish to stores or claim untested platform support.
```

### P10 — Select one advanced release

```text
Plan the next P10 release. Assess guided 3x3 camera capture, evidence-based
coaching, additional puzzle/method packs, solve analysis and optional Satori
share cards. Recommend one bounded slice with prerequisites, verification,
source rights, privacy and costs. Keep community, official-result integrations,
voice and paid services separately scoped. Do not start several advanced
features or purchase services from this planning command.
```

## Status and recovery prompts

```text
Show our current phase, completed work, remaining decisions, latest pushed
commit and live deployment status. Do not change code.
```

```text
Continue the current phase from the last verified checkpoint. Preserve existing
work and saved data. Do not start the next phase yet.
```

```text
Help me test the latest release on my device. Give me one short round at a time
and explain what I should see before moving on.
```

```text
Pause new features. Diagnose the reported regression, preserve data, fix the
confirmed cause, test recovery and publish the verified correction.
```

## What finished means

Report evidence, not planned libraries. A mocked BLE demo is not a hardware release; a prototype is not a framework migration; a build is not proof of data preservation; a native folder is not a store release. Use the [phase exit gates](07-delivery.md). No phase is complete just because this guide contains its prompt.
