# Whole-product reference audit and delivery contract

17 September 2026; signed-in review 18 September · Reference UI version observed: 1.0.297 · Audited scope, not feature parity

The owner requested the whole [SpeedcubeQuest product](https://speedcube.quest/), including multi-puzzle libraries, learning, trainers, timing, analysis and account/device tools. This supersedes the earlier 3×3-tutorial-first recommendation. Keep the original simulator at home and the eight sections behind Menu.

## Evidence and limits

Inspected public pages and rendered controls in the built-in browser, followed catalogue/guide links, exercised timer/settings dialogs and search, and ran the public solve-analysis example. Consulted source pages and dated release notes. The live catalogue exposes **26 sets**: 11 for 2×2, 12 for 3×3 and three big-cube sets. Older indexed pages sometimes show fewer; live navigation takes precedence. Thousands of individual algorithms were not independently tested.

The public guide index lists three teaching and three reference guides. Complete 2×2, 4×4, 5×5 and larger-cube courses are additional owner requirements, not claims about available reference courses.

After the owner signed in and authorized inspection, profile, Statistics, Training insights, account and import/export controls were reviewed read-only. Profile exposes personal bests and algorithm progress. Statistics includes an activity calendar and progress summaries; no timed solves were present, so populated solve charts remain unverified. Training insights shows per-set/case skill, repetitions, recent-form success/timing and drill links. Import accepts own-format or csTimer JSON; export offers JSON/CSV. Account exposes identity changes, WCA linking, profile privacy and deletion. No settings, records or account data were changed; personal identifiers are excluded from this repository.

The linked Speffz trainer and blindfold guide still require alpha-tester access after ordinary sign-in. Reconstruction databases/profiles and some F2L/lookahead tools are described in release notes but were not fully exercised. Letter-pair practice appears in public interface descriptions; its page flow remains unverified. No hardware pairing, account creation, import/export, deletion or account linking was performed. Credits do not establish feature availability or grant reuse rights.

The [machine-readable inventory](reference-coverage.json) records **99 capabilities**, with stable IDs, source/evidence, local status, release, dependencies and acceptance checks. Existing means local functionality exists, not complete reference parity. Partial means a useful foundation exists; missing means implementation remains. Evidence distinguishes live UI, public descriptions, release notes, restricted access, interface descriptions and owner additions.

## Architecture changes

- Separate puzzle capabilities: model, notation, renderer, scrambler, solver, courses and devices. The core and shared player support sizes 2–5; existing learning packs and solver remain 3×3. A selector does not establish complete big-cube courses or non-cube support.
- Share a reversible lesson/case player: play/pause, seek, speed, looping, camera reset, highlights and synchronized instructions. Lazy-load it, pause hidden players and dispose WebGL resources.
- Version content packs with puzzle/method, prerequisites, stable case IDs, independent fixtures, stage predicates, orientation/AUF, variants and provenance. Catalog, training, guides and analysis reference the same identities.
- Separate preferences, explicit learning ratings, recognition answers, guided repetitions and timed solves. Watching animation does not prove mastery. Preserve current storage keys and IDs through additive adapters.
- Support independent GAN, MoYu and QiYi transports behind a common validated state/event contract. A GAN package does not implement the other brands. Qualify browser and native transports separately.
- Give solve analysis and reconstruction search named releases. Independently verify phase detection and metric definitions. Rankings require traceable reusable datasets; missing evidence cannot become invented percentages.
- Retain our original theme, home, panels and 3D baseline. Follow the reference's clear task organization and learning controls; author explanations/assets and review each imported artifact's rights.

Source case totals are not an acceptance oracle. F2L mixes standard, advanced and slot equivalences; some ZBLS/big-cube descriptions disagree with their badges. Declare the taxonomy and source mappings before claiming complete coverage. Keep handed variants and existing progress IDs distinct.

## Expanded releases

These subdivisions preserve P0–P10 and historical M releases. Completion requires accepted inventory entries and preservation checks.

| Release | Deliverable |
| --- | --- |
| P1A | Search the tools already available, preserving navigation guards |
| P2A | Multi-puzzle capability registry, notation adapters and common player |
| P2B | Measure stack/rendering candidates and record keep/migrate decision |
| P3A | Existing PLL/OLL/F2L catalog, favorites, variants, ratings and notation preferences |
| P3B | Eleven 2×2 packs in verified batches |
| P3C | Expanded F2L, two-look, COLL/WV/VLS/ZBLS/ZBLL and Roux second block/CMLL/EO |
| P3D | 4×4, 5×5 and 6×6 endgame packs with size-specific validation |
| P3E | Cross-pack sequence lookup, equivalence and source/video links |
| P4A–P4D | Complete 3×3, 2×2, 4×4 and 5×5 courses respectively |
| P4E | Intuitive F2L, two-look, notation/glossary and printable sheets |
| P4F | Larger-cube lessons, blindfold foundations and reviewed translations |
| P5A | Virtual, flashcard and physical-scramble drills across installed packs |
| P5B | Expanded PLL/OLL recognition, corner deduction and feedback |
| P5C | Cross/X-cross planning, checked solutions and replay |
| P5D | F2L partial practice and lookahead |
| P5E–P5F | Spaced review, sticker-letter and letter-pair practice |
| P6A | Event sessions/scrambles through 7×7 and focused timer controls |
| P6B–P6C | Solve charts/calendar/imports, then training insights/activity |
| P7A–P7C | GAN, then independently qualified MoYu and QiYi |
| P8A–P8C | Optional authentication, sync, then profiles/data controls |
| P9A–P9C | Qualified PWA, native packages, then native device/camera support |
| P10A | Local CFOP/Roux analysis with stage replay and case links |
| P10B–P10C | Licensed reconstruction library/rankings, then share/export |
| P10D | Other methods/puzzles, including reference-planned or credited items |
| P10E | Project camera input and evidence-based coaching |

**P2A is implemented**; see [shared playback release](23-playback-release.md). **P2B is complete** with a [measured decision to retain React and the current renderer](24-stack-evaluation.md); no migration has shipped. Next is **P3A** catalog consolidation. Then deliver an early complete 2×2 path (P3B Ortega + P4B) alongside P4A, rather than postponing every non-3×3 experience until advanced work ends. Expand packs and drills in verified batches. P10A can follow its catalog prerequisites without waiting for accounts/native: phase numbers do not force dependency-independent work to the end.

## Hosting

| Work | Execution and storage |
| --- | --- |
| Catalog, search, guides, player, ordinary trainers | Static versioned packs and local device; GitHub Pages |
| Scramble, solver, analysis, import | Bounded workers with progress/cancellation and memory limits |
| Timer and local statistics | Existing local repositories; work off the timer input path |
| Published reconstructions/rankings | Licensed build-time snapshots first; optional server index if measurements justify it |
| Accounts, cross-device sync, private records | Optional Supabase/backend; Pages remains the frontend |
| Bluetooth | Local browser/native transport; server hosting cannot add missing BLE capability |
| Native apps | Shared domain/content plus platform packaging and qualification |

No Coolify or rented compute is required for the local-first product. Account services and optional server jobs are separate operating decisions. No paid services, embedded secrets or automatic uploads are authorized by this scope.

## Coverage matrix

Exact evidence, acceptance and dependencies are in the JSON inventory. This is a planning record, not a menu of working features.

| ID | Area / capability | Local status | Release | Reference |
| --- | --- | --- | --- | --- |
| set-2x2-ortega | Algorithms: 2x2: ortega | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/ortega) |
| set-2x2-cll | Algorithms: 2x2: cll | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/cll) |
| set-2x2-eg-1 | Algorithms: 2x2: eg-1 | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/eg-1) |
| set-2x2-eg-2 | Algorithms: 2x2: eg-2 | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/eg-2) |
| set-2x2-leg-1 | Algorithms: 2x2: leg-1 | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/leg-1) |
| set-2x2-tcll-plus | Algorithms: 2x2: tcll-plus | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/tcll-plus) |
| set-2x2-tcll-minus | Algorithms: 2x2: tcll-minus | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/tcll-minus) |
| set-2x2-fh | Algorithms: 2x2: fh | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/fh) |
| set-2x2-teg-1 | Algorithms: 2x2: teg-1 | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/teg-1) |
| set-2x2-teg-2 | Algorithms: 2x2: teg-2 | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/teg-2) |
| set-2x2-ls | Algorithms: 2x2: ls | missing | P3B | [live-ui](https://speedcube.quest/algorithms/2x2/ls) |
| set-3x3-f2l | Algorithms: 3x3: f2l | partial | P3A | [live-ui](https://speedcube.quest/algorithms/3x3/f2l) |
| set-3x3-2-look-oll-and-pll | Algorithms: 3x3: 2-look-oll-and-pll | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/2-look-oll-and-pll) |
| set-3x3-oll | Algorithms: 3x3: oll | partial | P3A | [live-ui](https://speedcube.quest/algorithms/3x3/oll) |
| set-3x3-pll | Algorithms: 3x3: pll | partial | P3A | [live-ui](https://speedcube.quest/algorithms/3x3/pll) |
| set-3x3-coll | Algorithms: 3x3: coll | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/coll) |
| set-3x3-wv | Algorithms: 3x3: wv | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/wv) |
| set-3x3-vls | Algorithms: 3x3: vls | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/vls) |
| set-3x3-zbls | Algorithms: 3x3: zbls | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/zbls) |
| set-3x3-zbll | Algorithms: 3x3: zbll | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/zbll) |
| set-3x3-second-block | Algorithms: 3x3: second-block | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/second-block) |
| set-3x3-cmll | Algorithms: 3x3: cmll | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/cmll) |
| set-3x3-eo | Algorithms: 3x3: eo | missing | P3C | [live-ui](https://speedcube.quest/algorithms/3x3/eo) |
| set-big-cubes-4x4 | Algorithms: big-cubes: 4x4 | missing | P3D | [live-ui](https://speedcube.quest/algorithms/big-cubes/4x4) |
| set-big-cubes-5x5 | Algorithms: big-cubes: 5x5 | missing | P3D | [live-ui](https://speedcube.quest/algorithms/big-cubes/5x5) |
| set-big-cubes-6x6 | Algorithms: big-cubes: 6x6 | missing | P3D | [live-ui](https://speedcube.quest/algorithms/big-cubes/6x6) |
| navigation | Menu: Eight sections, breadcrumbs and return to original cube | existing | P1 | Owner request |
| tool-search | Menu: Search available tools with keyboard and touch | existing | P1A | [live-ui](https://speedcube.quest/) |
| resume-dashboard | Menu: Resume lessons, recent activity and progress summary | missing | P6C | [live-ui](https://speedcube.quest/) |
| puzzle-capabilities | Foundation: Puzzle and method registry with explicit capabilities | existing | P2A | Owner request |
| player | Foundation: Shared 3D play/pause, seek, reverse, speed, loop and reset | existing | P2A | [live-ui](https://speedcube.quest/guides/how-to-solve-a-rubiks-cube) |
| notation-engine | Foundation: Wide, slice, inner-layer and rotation notation adapters | existing | P2A | [public-page](https://speedcube.quest/algorithms/big-cubes/6x6) |
| stack-proof | Foundation: Measured React/SvelteKit and cubing.js decision | existing | P2B | Owner request |
| library-core | Algorithms: Searchable sets/cases, grouped overview, filters and sorting | partial | P3A | [public-page](https://speedcube.quest/algorithms/3x3/pll) |
| favorites | Algorithms: Favorite sets and preferred algorithm variants | missing | P3A | [public-page](https://speedcube.quest/algorithms/3x3/pll) |
| knowledge | Algorithms: Shared per-case and per-variant learning status | missing | P3A | [public-page](https://speedcube.quest/algorithms/3x3/pll) |
| triggers | Algorithms: Trigger groups, commutators, conjugates and accessible notation | missing | P3A | [public-page](https://speedcube.quest/guides/rubiks-cube-notation) |
| alg-lookup | Algorithms: Exact sequence and fragment lookup across packs | missing | P3E | [public-page](https://speedcube.quest/algorithms/lookup) |
| alg-equivalence | Algorithms: Equivalent notation, rotations, inverses and mirror handling | missing | P3E | [public-page](https://speedcube.quest/algorithms/3x3/pll) |
| usage-ranking | Algorithms: Sourced usage, votes, consensus and year/grip/method filters | missing | P10B | [public-page](https://speedcube.quest/algorithms/3x3/f2l) |
| f2l-slots | Algorithms: Four F2L slots, advanced cases and rotation/reduction views | partial | P3C | [public-page](https://speedcube.quest/algorithms/3x3/f2l) |
| f2l-effects | Algorithms: Piece disturbance, EO and last-slot effect diagrams | missing | P3C | [public-page](https://speedcube.quest/algorithms/3x3/f2l) |
| video-sources | Algorithms: Case-specific external tutorials and source attribution | missing | P3E | [public-page](https://speedcube.quest/credits) |
| guide-3 | Guides: Complete first-solve 3x3 course | partial | P4A | [live-ui](https://speedcube.quest/guides/how-to-solve-a-rubiks-cube) |
| guide-2 | Guides: Complete 2x2 course and Ortega bridge | missing | P4B | Owner request |
| guide-4 | Guides: Complete 4x4 course with reduction and parity | missing | P4C | Owner request |
| guide-5 | Guides: Complete 5x5 course with centres and last edges | missing | P4D | Owner request |
| guide-large | Guides: 6x6 and 7x7 learning extensions | missing | P4F | Owner request |
| guide-f2l | Guides: Intuitive F2L, mirrored explanations and full walkthroughs | partial | P4E | [public-page](https://speedcube.quest/guides/beginner-f2l) |
| guide-two-look | Guides: Two-look OLL/PLL path | missing | P4E | [public-page](https://speedcube.quest/guides/2-look-oll-pll) |
| guide-reference | Guides: Notation, F2L naming and searchable tagged glossary | partial | P4E | [public-page](https://speedcube.quest/guides) |
| guide-layout | Guides: Stage contents, goal diagrams, synced text and recovery help | partial | P4A | [live-ui](https://speedcube.quest/guides/how-to-solve-a-rubiks-cube) |
| guide-print | Guides: Printable cheat sheets and text/diagram alternatives | missing | P4E | [public-page](https://speedcube.quest/guides/2-look-oll-pll) |
| guide-language | Guides: Localized lessons and terminology | missing | P4F | [release-notes](https://speedcube.quest/change-log) |
| guide-bld | Guides: Speffz lettering and blindfold foundations | missing | P4F | [alpha-gated](https://speedcube.quest/guides/bld-lettering) |
| drill-modes | Training: Virtual execution, flashcard and physical scramble modes | partial | P5A | [public-page](https://speedcube.quest/trainers/algorithms) |
| drill-selection | Training: Selected cases, random/ordered/weighted practice | partial | P5A | [release-notes](https://speedcube.quest/change-log) |
| drill-sets | Training: OLL, PLL, COLL, WV, VLS, ZBLS, ZBLL, CMLL, second block and EO | partial | P5A | [public-page](https://speedcube.quest/trainers/algorithms) |
| pll-recognition | Training: Two-sided PLL patterns, weighting and confusion feedback | partial | P5B | [public-page](https://speedcube.quest/trainers/pll-recognition) |
| oll-recognition | Training: OLL shape recognition and lookalike comparison | missing | P5B | [public-page](https://speedcube.quest/trainers/oll-recognition) |
| corner-deduction | Training: Hidden-corner colour deduction | missing | P5B | [live-ui](https://speedcube.quest/trainers/corner-deduction) |
| corner-stats | Statistics: Colour-pair accuracy/time heatmaps and per-case drill stats | missing | P6C | [live-ui](https://speedcube.quest/trainers/corner-deduction) |
| cross | Training: Cross/X-cross planning and solution replay | missing | P5C | [public-page](https://speedcube.quest/trainers/cross) |
| f2l-lookahead | Training: Partial F2L and next-pair prediction | missing | P5D | [release-notes](https://speedcube.quest/change-log) |
| review | Training: Weak-case and spaced review | missing | P5E | Owner request |
| bld-trainer | Training: Sticker-letter recall | missing | P5F | [alpha-gated](https://speedcube.quest/trainers/speffz) |
| letter-pairs | Training: Editable letter-pair words and forward/reverse review | missing | P5F | [interface-advertised](https://speedcube.quest/) |
| timer-sessions | Timer: Named event sessions, inspection and partial/full classification | partial | P6A | [live-ui](https://speedcube.quest/timer) |
| timer-events | Timer: 2x2 through 7x7 scrambling | partial | P6A | [live-ui](https://speedcube.quest/timer) |
| timer-controls | Timer: Scramble visibility, hidden running time and wake lock | partial | P6A | [live-ui](https://speedcube.quest/timer) |
| timer-edit | Timer: History, penalties, deletion recovery and backups | existing | P6A | Owner request |
| stats-solves | Statistics: Solves, averages, bests, charts, sessions and activity calendar | partial | P6B | [signed-in-ui](https://speedcube.quest/statistics) |
| stats-training | Statistics: Training insights, accuracy, speed and activity | partial | P6C | [signed-in-ui](https://speedcube.quest/statistics/training) |
| timer-import | Timer: csTimer/own JSON import and JSON/CSV export | missing | P6B | [signed-in-ui](https://speedcube.quest/statistics) |
| analyzer | Solve: CFOP/Roux reconstruction segmentation and case detection | missing | P10A | [live-ui](https://speedcube.quest/solve-analyzer) |
| analysis-player | Solve: Stage replay, masks, metrics and algorithm links | missing | P10A | [live-ui](https://speedcube.quest/solve-analyzer) |
| reconstruction-library | Solve: Searchable reconstructions, solver and reconstructor profiles | missing | P10B | [release-notes](https://speedcube.quest/change-log) |
| share | Solve: Shareable analysis and optional result cards | missing | P10C | Owner request |
| gan | Devices: GAN live moves and synchronization | missing | P7A | [signed-in-ui](https://speedcube.quest/smart-cube) |
| moyu | Devices: MoYu adapter | missing | P7B | [signed-in-ui](https://speedcube.quest/smart-cube) |
| qiyi | Devices: QiYi adapter | missing | P7C | [signed-in-ui](https://speedcube.quest/smart-cube) |
| device-management | Devices: Remember/name devices, diagnostics and connection guidance | missing | P7A | [signed-in-ui](https://speedcube.quest/smart-cube) |
| device-training | Training: Smart-cube timing, guided execution and move replay | missing | P7A | [public-page](https://speedcube.quest/trainers/cross) |
| virtual-input | Practice: Keyboard and touch/swipe virtual controller fallback | partial | P7A | [signed-in-ui](https://speedcube.quest/smart-cube) |
| theme | Settings: Light/dark/system preferences | partial | P2A | [live-ui](https://speedcube.quest/settings) |
| notation-settings | Settings: Notation font/spacing, trigger labels, slice preference and colour-blind palette | missing | P3A | [live-ui](https://speedcube.quest/settings) |
| account-auth | Account: Optional Google, WCA or email sign-in and account recovery | missing | P8A | [signed-in-ui](https://speedcube.quest/account) |
| account-sync | Account: Cross-device solves, preferences and progress | missing | P8B | [public-page](https://speedcube.quest/privacy) |
| profile | Account: Private account settings and optional public profile | missing | P8C | [signed-in-ui](https://speedcube.quest/account) |
| data-rights | Account: Export, correction, deletion and truthful privacy controls | partial | P8C | [signed-in-ui](https://speedcube.quest/account) |
| pwa | Platform: Installable app, offline downloads and update recovery | partial | P9A | [public-page](https://speedcube.quest/about) |
| native | Platform: Phone/tablet/desktop packages with platform adapters | missing | P9B | Owner request |
| native-devices | Platform: Native BLE and camera qualification | missing | P9C | Owner request |
| credits | About: Credits, licenses, app history and developer information | partial | P3A | [public-page](https://speedcube.quest/credits) |
| feedback | About: Feedback/reporting and community links | missing | P8C | [public-page](https://speedcube.quest/about) |
| legal | About: Privacy and terms matching actual behavior | missing | P8A | [public-page](https://speedcube.quest/terms) |
| other-puzzles | Future packs: ZZ, Pyraminx and Megaminx | missing | P10D | [live-ui](https://speedcube.quest/) |
| additional-sets | Future packs: Other credited sets, Skewb and Square-1 | missing | P10D | [public-page](https://speedcube.quest/credits) |
| scanner-coach | Project extensions: Camera entry and evidence-based coaching | missing | P10E | Owner request |

## Preservation and delivery

Preserve original home/settings/statistics, direct-panel return links, theme, 3D quality and bookmarks. Retain legacy cube records, timer IndexedDB, eight prepared lesson IDs and all trainer/recognition data. Search must respect active move queues and modal dialogs. Do not add empty future-feature cards.

Content needs independent fixtures and stage preservation checks, not only an algorithm applied after its inverse. Runtime releases need relevant unit/type/build/browser checks, built-in browser inspection, data/offline upgrade checks and rendered live verification. Test narrow phones, tablets, desktop and reduced motion. Account/hardware qualification remains separate.

Update inventory statuses only with implementation evidence. A contract or placeholder cannot change missing to existing. Record subsequent audits with dates rather than claiming an eternal exhaustive list.

## Overall continuation prompt

```text
Continue the full-product build using docs/architecture/21-product-coverage.md,
reference-coverage.json, 17-platform-architecture.md and 07-delivery.md.
The scope includes every tracked capability, not only 3x3 tutorials.
Inspect the current verified checkpoint, then implement the next dependency-ready
bounded release. Keep React unless a measured stack decision authorizes a change.
Preserve original simulator, theme, panels, 3D quality, URLs and saved data.
Use reviewed content and explicit puzzle capabilities; no fake working features
or unlicensed imports. Update coverage status with implementation evidence.
Test relevant behavior and the built-in browser, push verified changes to main,
verify CI/Pages and live routes, and explain my test steps and next release.
```

## P2A implementation prompt (completed)

```text
Start P2A from our whole-product coverage plan. Add a multi-puzzle capability
registry and shared playback/notation contracts on React. Preserve 2x2-5x5
checkpoints, lessons, trainers and the original simulator. Make the common player
reversible and seekable, with pause, speed, replay, reduced motion and synchronized
step explanations. Qualify each size separately; a registry entry does not prove
6x6/7x7 or non-cube support. Test correctness, storage, performance and the built-in
browser, push verified work and verify deployment. Keep every inventory feature
in scope for its named release.
```
