# Build guide: what changes next and what to ask for

This is the plain-language guide for the repository owner. The detailed engineering plan remains in [the architecture index](README.md).

## Where we are now

The existing simulator is live at https://rahulsinghparmar.github.io/the-cube/.
The foundation, architectural plan, deployment setup, M1 web timer and M2 web interface/engine are implemented. The full product described in the original brief is not built yet. See [M1 release and testing notes](09-m1-release.md) and [M2 release and testing notes](10-m2-release.md) for verified scope and limits.

Completed: keyboard face controls and guide, build/offline repairs, selected game/data bug fixes, automated checks, architecture documents, primary `main` branch, preserved original `master`, and automatic publication after successful main-branch checks.

M1 adds the dedicated physical-cube timer, inspection, session statistics/history, safe local storage, result review, backup/import and legacy migration.

M2 adds the modern Play/Settings interface, exact typed cube engine, queued moves, custom keys, themes and English/Hindi foundations. The physical timer and original simulator remain available with their saved data. Still to build: lessons, solver, trainer, accounts, synchronization, scanner, coach and native applications.

Before M3, the owner requested a navigation refinement: restore the original
full-screen touch cube at the main URL, and place Practice, Timer, Settings,
License and About the Developer on a separate menu. [Current homepage and menu
guide](11-home-and-menu.md). The newer cube is now labeled **Practice**; both
saved cubes and physical sessions remain separate and available. M3 has not started.

The next milestone is **M3: learning and solving**. “M” means milestone: a smaller release-sized part of the original product plan. M0–M2 deliver the initial web foundation; full accessibility certification, device qualification and later original-vision features are not implied.

## How to use the commands

The commands in this guide are messages to paste into the development conversation. They are not terminal commands and do not require any software setup by the owner. Send one milestone command at a time. Do not send all of them together.

For each command, first inspect the actual repository and prerequisite status, preserve existing functionality/data, implement the named scope, run relevant checks, commit and push verified changes to `main`, and verify the resulting Pages deployment. Preserve `master` and the neutral naming policy in [CONTRIBUTING.md](../../CONTRIBUTING.md). A service purchase or migration to a different host is not implied by a milestone prompt; present actual provider/cost choices before that decision is required.

## Milestones and copy-paste commands

| Milestone | Status | What changes for the user | Message to send |
| --- | --- | --- | --- |
| M0 — Foundation | Complete | Existing cube works with keyboard controls, offline loading and tested publishing | `Show the current build status and any remaining foundation defects.` |
| M1 — Practice timer and data | Implemented; web release | A separate timer for a real cube, inspection, penalties, solve history, sessions, averages and backup/import | `Review the M1 release and help me test the physical-cube timer and backup recovery on my device.` |
| M2 — Application and cube engine | Implemented; web release | Clear navigation, improved mobile/accessibility controls, settings, custom keys, reliable queued moves, themes and language foundations | `Review the M2 release and help me test the new Play interface, custom keys, saved cube and offline timer on my device.` |
| M3 — Learning and solving | Planned | Beginner lessons, manual entry of a 3x3 state, a checked solution and controllable move playback | `Start M3 from our architecture plan. Add reviewed beginner lessons, manual cube-state entry and a verified 3x3 solver with step-by-step playback.` |
| M4 — Algorithm practice | Planned | Practice PLL, then OLL/F2L cases; track recognition and execution attempts | `Start M4 from our architecture plan. Build the algorithm trainer, beginning with PLL, then validated OLL and F2L content, with saved practice progress.` |
| M5 — Accounts and synchronization | Planned | Optional sign-in, profile, cross-device history, export/deletion and visible conflict recovery | `Start M5 from our architecture plan. Prepare provider and operating-cost choices, then implement optional accounts and safe cross-device synchronization once those choices are settled. Keep offline guest practice working.` |
| M6 — Camera scanner | Planned | Capture the six faces of a 3x3, correct uncertain colors, validate the state and obtain a solution | `Start M6 from our architecture plan. Build the guided 3x3 camera scanner with manual color correction, state validation and verified solution playback.` |
| M7 — Coaching | Planned | Suggestions based on recorded evidence; optional AI explanations, training plans and voice | `Start M7 from our architecture plan. Add evidence-based coaching and training recommendations first, then propose optional AI and voice features with clear cost and privacy controls.` |
| M8 — Mobile and desktop | Planned | Installable Android/iOS and desktop applications with tested permissions, storage and updates | `Start M8 from our architecture plan. Evaluate the native wrappers on real devices, then package the web product for mobile and desktop with tested offline storage and updates.` |

At M5 and M8, work can begin with architecture/provider/device preparation; it cannot honestly finish account hosting or store publication without the necessary owner decisions, accounts and credentials. Report the exact remaining dependency rather than marking the milestone complete.

## Completed M1 implementation steps

T-101 through T-107 are implemented for the web release. The original step prompts below are retained for traceability; use the release review command above instead of rebuilding completed steps. Some necessary engineering work has no immediate visible interface change.

| Step | Change | What you can see | Message |
| --- | --- | --- | --- |
| T-101 | Add strict typed module/build setup for timing and statistics | Existing game stays the same; stronger checks appear in CI | `Implement T-101 from M1 only, verify it and push the change.` |
| T-102 | Implement timer states, keyboard/touch events, inspection and interruption handling | Engine work first; the timer page arrives in T-106 | `Implement T-102 from M1 with timing-boundary and input tests.` |
| T-103 | Implement penalties, DNF, trimmed averages and personal-best calculations | Calculation engine first; visible statistics arrive in T-106 | `Implement T-103 from M1 with tested Ao5, Ao12, Ao100, penalties and DNF handling.` |
| T-104 | Add transactional local storage and failure recovery | Data infrastructure; no cloud account required | `Implement T-104 from M1 with safe local sessions and solve persistence.` |
| T-105 | Preserve/import old history and add JSON backup/import | Backup and migration functions; controls connect in T-106 | `Implement T-105 from M1. Preserve legacy data and add validated backup, import and recovery.` |
| T-106 | Connect the physical timer page, session picker, history and statistics | This is the main visible timer release | `Implement T-106 from M1. Connect the tested timer, statistics and storage into an accessible physical-cube timer interface.` |
| T-107 | Verify complete journeys, mobile layout, offline reload and data recovery | A tested, published M1 release plus steps you can try | `Complete T-107 and verify all M1 acceptance criteria. Publish the tested result and tell me exactly how to test it.` |

## Later features from the original vision

These remain in scope as future workstreams beyond the M1/M2 web releases. They require their own acceptance criteria and, in some cases, operating-cost/moderation decisions.

| Workstream | Prerequisite | Planning command |
| --- | --- | --- |
| Friends, clubs, shared progress, public feed | Accounts/sync, privacy and moderation capacity | `Prepare the community milestone from our original vision, with private sharing first and moderation before public posting.` |
| Leaderboards and virtual competitions | Accounts, defined result trust classes, anti-replay and moderation | `Prepare the leaderboard and virtual competition milestone. Keep official, self-reported and simulator results clearly separated.` |
| Official profiles and competition finder | Validated upstream source/permissions, cache/freshness policy | `Plan official competition-profile integration and a competition finder, including source verification and identity linking.` |
| Cube collection | Core progress/data system | `Plan the cube collection manager with equipment, setup and maintenance records.` |
| More solver methods and larger-cube scans | Validated 3x3 solver/scanner and dedicated research | `Assess the next supported cube size and pedagogical solving method. Give me correctness and device-test requirements before implementation.` |
| All requested languages | Message catalog and reviewed translations | `Plan the remaining requested languages after English and Hindi, with reviewed lessons and accessible layouts.` |
| Premium/billing | A useful free product, paid-feature validation, operator/legal decisions | `Prepare a monetization plan with clear free features, cost estimates, entitlements and cancellation handling. Do not purchase services yet.` |

## How this maps to the original six phases

| Original phase | Original intent | Current architecture mapping | Current completion |
| --- | --- | --- | --- |
| Phase 1 | Refactor, types, modules, tests, responsive UI, keyboard, timer, statistics, PWA | M0 + M1 + M2 | Web scope implemented; broader physical-device/accessibility qualification remains |
| Phase 2 | Accounts, profiles, leaderboards, sync, languages, dark mode, analytics | M2 for UI/themes/language foundations; M5 for accounts/sync; later community for rankings | Themes and language foundations implemented; accounts/community planned |
| Phase 3 | Scanner, image processing, reconstruction, solver | M3 validates the solver/manual input first; M6 adds camera input | Planned |
| Phase 4 | Tutorials, algorithm database and OLL/PLL/F2L practice | M3 lessons + M4 trainer | Planned |
| Phase 5 | Coach, personalized learning, solve analysis, voice | M7 plus playback voice where appropriate | Planned |
| Phase 6 | Mobile, desktop, offline and notifications | Offline begins in M0/M1; M8 packages platforms and adds optional notifications | Basic web offline done; native work planned |

We are following the product destination, with a changed execution order. Practice and lessons come before the cost and complexity of accounts. A checked solver comes before camera reconstruction, because a scanner needs a trustworthy way to validate and solve its output.

## What changed from the suggested technology stack

The original brief suggested Next.js, React, TypeScript, Tailwind, NestJS, PostgreSQL, Redis, several managed services, Flutter and Tauri. The web implementation now uses React/Vite and strict TypeScript domain modules while retaining the original simulator. Fastify, PostgreSQL and shared web-based mobile/desktop shells remain proposals. Redis and provider-specific services are postponed until justified. Mobile currently proposes Capacitor rather than Flutter to reuse the web application.

If exact technology choices matter more than reuse, send: `Revise the architecture to follow my original technology stack. Explain the migration and operating-cost differences before changing application code.`

The server database/API/component-library work is currently a design. The strict practice and cube-core packages, guest IndexedDB and React web workspace now exist; the database server, complete UI library and GitHub Project board have not been created. Coverage above 90%, full accessibility conformance and Lighthouse above 95 remain targets to measure, not completed achievements.

## Optional visual work

External creative tools can help with decorative artwork, achievement illustrations, marketing images and trailers. Keep accurate cube diagrams and instructional moves generated from the tested cube engine. A generated picture or video is not evidence that a move sequence is legal or correct.

Useful planning message: `Prepare an optional visual asset plan for the game. List each asset, purpose, size and expected generation cost. Keep the existing repository and live site, and wait for my budget approval before paid generation.`

Do not move the app to another builder/host simply to add visuals. Evaluate a separate prototype first if a hosting migration is desired. Verify current plan entitlements, generation credits, export terms and connection availability at that time.

## Status and recovery commands

```text
Show our current phase, completed features, remaining work, latest pushed commit and live deployment status. Do not change code.
```

```text
Continue the current milestone from the last verified checkpoint. Do not start the next milestone yet.
```

```text
Explain the latest change in plain language and give me the steps to test it on the live site.
```

```text
Review the live site for regressions, fix confirmed issues, verify them, and push each complete correction.
```

```text
Pause implementation and show the current status, remaining decisions and next recommended command.
```

After a completed change, report: **current milestone; what visibly changed (or why it was internal work); checks; pushed commit; live URL; simple user test; remaining work; next command**. Update this guide's status only when the acceptance criteria have actually passed.
