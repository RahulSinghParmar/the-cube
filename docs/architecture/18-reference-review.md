# Reference and dependency review

Reviewed 16 September 2026. The owner's pasted SpeedcubeQuest credits are a research lead, not proof that every linked dataset or asset is available for reuse. These recommendations are planning decisions; no new dependency is installed by this documentation change.

## Product references

| Reference | Observed pattern | Application to The Cube |
| --- | --- | --- |
| [SpeedcubeQuest](https://speedcube.quest/) | Separate algorithms, guides, trainers and timer; staged learning journey | Distinguish browsing from drills; connect a lesson to a case and a practice action |
| [CubeRoot](https://cuberoot.me/en) | Rendered navigation groups practice tools, training, learning and analysis | Clear destinations and quick access; avoid overwhelming a beginner with every advanced tool |
| [Algorithm directory](https://www.speedcubing.com/CubingAlgs.html) | Resources organized by puzzle and method | Design a catalog taxonomy that can expand beyond CFOP without promising every event now |
| [Software and trainers directory](https://www.speedcubing.com/SoftwareAndTrainers.html) | Links to timers, trainers, solvers and reconstruction tools | Use specialist tools as research examples; keep application responsibilities distinct |
| [Tutorial directory](https://www.speedcubing.com/CubingTutorials.html) | Beginner and method-specific learning resources | Curate source links, prerequisites and difficulty; do not present every linked tutorial as reviewed |
| [Speedcube beginner guide](https://in.speedcube.com.au/pages/how-to-solve-a-rubiks-cube) | Ordered stages with orientation, matching situations and troubleshooting | Short lessons with a clear goal, interactive example, learner check and recovery help |

CubeRoot and the tutorial directory were inspected in the built-in browser because text retrieval was incomplete. CubeRoot's linked [source repository](https://github.com/2017YANR02/cuberoot.me) identifies GPL-3.0 licensing and describes React-based web/mobile components. Its architecture demonstrates that a useful cross-platform product is not tied to the SpeedcubeQuest stack. We have not copied either site's code or assets. No blanket open-source claim is made for SpeedcubeQuest's complete site or data.

## Requested tools: role and adoption decision

| Tool | Proposed role | Decision / integration boundary |
| --- | --- | --- |
| [cubing.js](https://github.com/cubing/cubing.js) | Notation, puzzle definitions, scrambles and candidate instructional playback | P2 compatibility/size/correctness spike, then selected P3/P5 use; retain canonical adapters and solver verification. Review MPL/GPL and bundled notices for the chosen release |
| [sr-visualizer / VisualCube TS](https://github.com/tdecker91/visualcube) | Lightweight static case diagrams | Conditional. Pasted credits say ISC, but the linked source exposes LGPL/GPL license files. Resolve exact npm artifact, source, inherited code and obligations before adoption; existing diagrams remain available |
| [Three.js](https://threejs.org/) | Original simulator and custom interactive 3D | Retain; upgrades only after visual/performance/state regressions pass; avoid redundant bundled versions |
| [Svelte and SvelteKit](https://svelte.dev/docs/kit/adapter-static) | Candidate replacement tools UI with static public pages | P2 prototype. Current React components require rewriting; pure TS modules are reusable. Keep Pages base path, old entry points and one offline worker |
| [Tailwind CSS](https://tailwindcss.com/docs/preflight) | Optional component styling using current theme tokens | Adopt only in a bounded UI area after measuring benefit. Disable or isolate global resets so original controls/canvas layouts remain intact |
| [shadcn-svelte](https://www.shadcn-svelte.com/docs) | Editable themed component source for a Svelte interface | Only if Svelte is selected; not a React drop-in. Adapt to original theme rather than applying its default appearance |
| [Bits UI](https://www.bits-ui.com/docs/introduction) | Accessible behavior primitives for Svelte controls | Use through the selected component approach; avoid duplicating dialog/select implementations. Manual accessibility still required |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) | Remote fetching, retries and cache state | P8 when a remote data consumer exists; choose the matching framework binding. Not the local database or sync protocol |
| [Chart.js](https://www.chartjs.org/docs/latest/general/performance.html) | Statistics trends and distributions | P6, lazy-loaded with aggregation/decimation and accessible summaries. Chart calculations consume tested statistics functions |
| [Lucide](https://lucide.dev/guide/) | Consistent small interface icons | P1/P2 if it improves consistency; import only used icons, retain labels and original meaningful symbols |
| [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) | GAN cube/timer events in compatible browsers | P2 feasibility, P7 browser release, P9 native qualification; exact hardware matrix and stream validation required |
| [Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) | Optional Auth, PostgreSQL, private assets and functions | P8 staged account/sync release, with RLS/grants and transactional sync tests; backend candidate, not automatic offline sync |
| [Satori](https://github.com/vercel/satori) | Optional SVG achievement/progress or public guide share cards | P10 optional. Converts supported markup/styles to SVG, not a 3D renderer. Prefer build-time generation on Pages; dynamic sharing needs a separate service or tested local export |

These are not thirteen mandatory installs. Introduce a library when its feature is implemented and it has passed dependency, performance and licensing review. Exact versions, transitive dependencies and license notices must be checked against the selected package artifacts at adoption. The credits' MIT/ISC/MPL labels do not replace that inventory.

## Content provenance and attribution

Maintain a source register per imported code/content item: upstream URL, author, revision/date, applicable license or permission, what was adapted, required attribution, local location and verification evidence. Distinguish code licensing from dataset, text, image, video, typography and trademark rights. Publicly readable does not imply redistribution rights.

SpeedCubeDB votes, reconstruction usage counts, BirdF2L taxonomy, archived cubesolv.es data and creator tutorial videos mentioned in the pasted credits each need their own review. A site-code MIT license does not establish the status of its reconstructions. Do not claim another site's consensus counts or copy its contributor list into our credits without actually using the relevant work. Initially author explanations and diagrams, verify case fixtures, and link to learning sources. Imported algorithm collections require provenance and a defined update policy, not an unreviewed bulk scrape.

Keep **References** (inspiration and further reading) separate from **Third-party notices** (work actually included). Preserve legally required notices and publish modified-source material when an adopted license requires it. A broad source tree copy from a GPL project requires a deliberate license compatibility review; it is not a shortcut to an ISC application.

## Cost and platform reality

Open-source code can reduce development cost; hosted services, email delivery, storage/egress, backups, native signing, store accounts and real-device testing have separate costs. Do not promise a permanently free production service or assume a free tier covers recovery requirements. Record current provider prices and an expected monthly budget in P8; assess signing/build costs in P9. No paid service is purchased by these phases' planning prompts.

Browser BLE capability and native transport support must be checked against the actual OS/browser/model at implementation. See the [Web Bluetooth implementation matrix](https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md), [Capacitor BLE candidate](https://github.com/capacitor-community/bluetooth-le) and [Tauri platform overview](https://v2.tauri.app/start/). A working Firefox UI does not establish GAN connectivity, and a passing simulated browser test does not establish hardware support.

## P2 decision evidence

Use one representative case detail page, one lesson step, a timer data read and a saved-progress round trip to compare existing React with a static SvelteKit prototype. Measure initial/route bytes, startup, interaction latency, accessibility, reduced motion, worker loading, WebGL cleanup, old-link compatibility and offline upgrade behavior under the same conditions. Include a small native BLE feasibility experiment if hardware/tooling are available; otherwise record the untested requirement explicitly.

Keep React if the prototype does not demonstrate a user benefit worth migration cost. If Svelte wins, record a dated decision and migrate one bounded route at a time through a temporary build arrangement. Avoid shipping two frameworks across every route indefinitely. Do not combine the framework cutover with data-schema or timer-engine changes. Prototype completion alone is not production migration acceptance.
