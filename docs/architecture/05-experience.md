# Experience, design system and component plan

## Navigation and layout

Preserve the existing cube appearance during foundation work. Introduce a restrained application shell around it rather than replacing the game with an unrelated dashboard. Main destinations: **Play**, **Timer**, **Learn**, **Train**, **Solve**, and **Progress**. Collection lives under Progress; profile, backup, preferences and support live under Settings. Community appears only when its module ships.

On desktop, use a compact top navigation and a content area with optional supporting panels. On mobile, expose the four most-used destinations with a More menu; keep the timer pad and cube interaction area clear of overlays. Lesson and solver pages can show a split instruction/cube view on wide screens and a stacked view on narrow ones. Do not require horizontal scrolling at a 320 CSS-pixel width for ordinary controls and text.

| Route family | Primary action | Required states |
| --- | --- | --- |
| `/play` | Start/resume virtual solve | Menu, scrambling, ready, turning, complete, saved, interrupted |
| `/timer` | Start/stop physical attempt | Inspection, holding, armed, running, saving, review, save failed |
| `/learn`, `/learn/:lesson` | Continue lesson | Locked prerequisite, downloaded, missing offline pack, step correction, complete |
| `/train` | Practice selected cases | Filter/select, recognition, execution, feedback, session summary |
| `/solve` | Enter/scan and solve | Manual grid, camera permission, face review, invalid state, computing, playback |
| `/progress` | Review personal history | Empty, filtered, edited result, pending sync, conflict, export |
| `/settings` | Configure controls/data | Key collision, theme preview, storage quota, import preview, account separation |

Paths are proposed router routes. The current GitHub Pages subpath must continue working: use static route output or a tested hash-route fallback for deep links on a host without rewrite rules. Public lesson/catalog pages need prebuilt crawlable HTML, metadata, canonical URLs and share cards; private progress/account pages must not be indexed.

## Visual tokens

Define semantic CSS variables in `packages/ui/tokens`; theme colors never enter the logical cube state. These are starting design values to test for contrast, not a completed redesign.

| Token | Light | Dark |
| --- | --- | --- |
| `surface` | `#FFFFFF` | `#111827` |
| `surface-muted` | `#F3F4F6` | `#1F2937` |
| `text` | `#111827` | `#F9FAFB` |
| `text-muted` | `#4B5563` | `#D1D5DB` |
| `accent` | `#1D4ED8` | `#93C5FD` |
| `focus-ring` | `#1D4ED8` | `#FBBF24` |
| `danger` | `#B91C1C` | `#FCA5A5` |

Spacing scale: 4/8/12/16/24/32/48 px. Body type: system sans-serif, 16 px base and 1.5 line height; timer: tabular numerals with fluid sizing; the existing display font remains an optional Play identity. Use 8/12 px corner radii and restrained borders. Core pointer targets should be at least 44×44 CSS pixels as a product preference. Keep motion short and optional; long decorative cube intros should be skippable and cannot block timer readiness.

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
