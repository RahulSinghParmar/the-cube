# Experience, design system and component plan

## Navigation and layout

Preserve the original cube appearance, homepage and original settings/statistics panels. Main tools destinations are **Algorithms**, **Training**, **Guides**, **Solve**, **Practice**, **Timer**, **Statistics** and **Settings**, with About and Licenses available. The [v2 route table](17-platform-architecture.md) is authoritative; new sections arrive in P1 while current links remain compatible. Profile/devices appear only when implemented. Algorithms is a reference library; Training records drills; Guides teaches a progression.

On desktop, use a compact top navigation and a content area with optional supporting panels. On mobile, expose the four most-used destinations with a More menu; keep the timer pad and cube interaction area clear of overlays. Lesson and solver pages can show a split instruction/cube view on wide screens and a stacked view on narrow ones. Do not require horizontal scrolling at a 320 CSS-pixel width for ordinary controls and text.

| Route family | Primary action | Required states |
| --- | --- | --- |
| Home `/the-cube/`; Practice `menu.html#/play` | Start/resume the selected virtual cube | Separate saved cubes; scrambling, turning, complete, interrupted |
| `menu.html#/algorithms` | Find and understand a case | Search/filter, variant selection, favorite, provenance, offline availability |
| `menu.html#/guides`; retain `#/learn` | Continue learning | Prerequisites, step correction, completion, saved resume |
| `menu.html#/training`; retain existing trainer hashes | Practice selected cases | Recognition, execution, feedback, saved summary |
| `timer.html` | Time a physical attempt | Inspection, armed, running, saving, review, save failed |
| `menu.html#/solve` | Enter and solve; scan later | Manual grid, invalid state, computing, checked playback |
| `menu.html#/statistics`; original `?panel=stats` | Review a chosen source of history | Empty, filtered, sample counts, edits, export; sync states later |
| `menu.html#/settings`; original `?panel=settings` | Configure app/cube/data | Direct original panels, controls, quota, backup preview |

New route entries are planned, not shipped by this document. Preserve the Pages subpath, HTML entry points and hashes. Public guide/catalog metadata may later use static generated pages; private history must not enter public output. Route changes must preserve storage scopes and support back/forward/reload/offline navigation. Direct original-panel links skip the cube intro and keep the original controls.

## Visual tokens

Derive semantic CSS variables from the existing original theme and current compatible tools styles. The old proposed blue/gray token palette is superseded. Record actual surfaces, text, focus, spacing and motion values during P1; test contrast before adjusting them. Theme colors never enter logical cube state. Scope any Tailwind reset or component-library styles to the tools application. Keep the original settings/statistics appearance and meaningful achievement symbol.

Keep the original display identity and readable body type; use tabular timer numerals and fluid sizing. Reuse measured spacing/radii before inventing another theme. Primary touch targets should be at least 44×44 CSS pixels as a product preference. Short, optional transitions must not block input. Keep keyboard guides hidden until requested. Show a static diagram for case grids and mount 3D only where useful; test rendering cleanup and reduced motion.

## Component contracts

| Component | Inputs / outputs | Accessibility and ownership |
| --- | --- | --- |
| AppShell/Nav | active route, available modules; navigation event | Landmarks, skip link, current-page state, keyboard focus after route changes |
| CubeViewport | canonical state, animation queue, theme; normalized move intent | Canvas has a textual state/move companion; no timer or persistence ownership |
| MoveButton/MoveSequence | canonical moves, current index; execute/select | Notation and full localized name; current step exposed without color alone |
| TimerPad/TimerDisplay | machine state, elapsed display; press/release/cancel | Real focusable control, touch equivalent, no live announcement on every frame |
| InspectionStatus | elapsed, frozen rule profile; warning events | Visual and optional audible cues; accessible textual phase/penalty |
| SessionPicker | compatible sessions; selected ID/create event | Labeled select/dialog; no hidden account reassignment |
| SolveHistory/SolveEditor | page of attempts, permissions; reviewed change | Semantic table/list, outcome text, keyboard actions, reason for edits |
| StatisticsSummary | named/versioned aggregates and sample counts | Explain trimming, missing samples and DNF; trend charts have text/table alternatives |
| KeyBindingEditor | profile, reserved keys; validated map | Collision detection, reset, import preview; does not consume unrelated shortcuts |
| LessonStep/CaseCard | reviewed content/version; attempt events | Heading order, plain-language feedback, replay and reduced-motion support |
| FaceEditor/ScannerPanel | facelets/confidence/permission; corrected state | Labels U/R/F/D/L/B plus row/column, explicit camera start/stop, manual fallback |
| PlaybackControls | move list/index/speed; play/pause/back/next | Space scoped appropriately; text progress; voice can be muted |
| SyncIndicator/ConflictDialog | local/outbox/conflict status; reviewed choice | Announces meaningful state changes; never represents queued data as synchronized |
| ImportPreview/ExportButton | parsed backup summary; commit/download | File size/errors, counts and migration warning before writing |
| SettingsControls | typed preference values; validated updates | Native ranges/selects first, visible labels, keyboard operation, no custom div-only sliders |

Components emit intent; application services execute changes. TimerPad cannot write local storage. CubeViewport cannot call the solver directly. Stories/fixtures cover empty, loading, offline, error, long translation, focus and reduced-motion states. Add a component preview tool when the reusable library exists, rather than generating an empty Storybook project now.

## Accessibility and language

Target WCAG 2.2 AA with automated checks plus manual keyboard and screen-reader testing. Pay particular attention to keyboard access, visible/unobscured focus, contrast, reflow and status messages. Passing an automated scan alone is insufficient. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

Do not convey cube colors or correctness by hue alone. Offer face-letter/pattern overlays and named move instructions. Manage focus when opening/closing dialogs and navigating between game states; return focus to the invoking control. Use `aria-live` for saved result, inspection phase and validation feedback, not for animation ticks. Users can disable voice/motion and choose an accessible timer input alternative. Test the existing custom sliders during migration rather than claiming that labeled buttons make the entire simulator accessible.

All product text uses stable message IDs with named parameters and plural rules. Start with English/Hindi; add the other requested languages with reviewed translations. Use Intl formatting for dates/numbers, keep raw data locale-independent, and render notation primes consistently. Support larger fonts and longer strings without clipped buttons. An RTL-ready layout uses logical CSS properties even though the first target languages are LTR. Translated lesson revisions maintain their link to the source content version.

## Offline, consent and recovery experience

The application distinguishes **available offline**, **download required**, **saved locally**, **waiting to sync**, **synced**, **conflict**, and **save failed**. A spinner without an outcome is not acceptable. Display asset-pack size before a solver/lesson download, allow cancellation and show storage use/removal controls. A storage error retains the last result in memory and offers retry/export; it must not advance as though saved.

Ask for camera only on Scan. Show which face to capture and a confidence/correction review. Request coaching data transfer only when that feature is used; basic practice remains available if declined. Account connection previews guest import. Account deletion and local data removal are separate, clearly explained actions.

Release updates should wait until no attempt is active. Provide a reload prompt with saved-data state, not an automatic mid-solve reload. Recovery copy must state whether the last attempt was saved, interrupted or recoverable; avoid technical implementation terminology in ordinary user flows.
