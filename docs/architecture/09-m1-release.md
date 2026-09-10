# M1 implementation and release checks

## Timing and statistics foundation

The private `packages/practice` workspace compiles with strict TypeScript. The retained simulator remains independently bundled. `npm test` compiles the workspace and runs both existing regressions and the new deterministic timing/statistics tests; `npm run build` also rejects type errors.

The timer uses an injected monotonic clock, a 300 ms hold-to-arm gesture, owned input pairs and explicit interruption. A separate native-click input path avoids requiring a timed hold for assistive input. Inspection starts on its own release; the stop release cannot arm another solve. Focus loss interrupts a running solve. Inspection expires as DNF at 17 seconds.

The practice rule profile follows the [WCA inspection boundaries](https://www.worldcubeassociation.org/regulations/#A4d1), checked against the April 1, 2026 regulations: start before 15 seconds without an inspection penalty; from 15 seconds add two seconds; at 17 seconds record DNF. This is a practice implementation, not a certified competition timer.

Statistics retain raw milliseconds, apply cumulative two-second penalties, exclude interrupted/deleted attempts and include DNF. Ao5/Ao12/Ao100 trim respectively 1/1/5 attempts at each end. Missing samples display a dash; an untrimmed DNF makes the average DNF. These larger practice averages are product rules. Personal best and averages are recalculated from records after edits. Centiseconds are rounded only for display.

## Delivered web scope

- T-101–T-103: strict workspace, injected-clock timer and versioned statistics.
- T-104: path-scoped guest IndexedDB with transactional session/solve writes, readback, device sequence and stale-edit rejection.
- T-105: one-time simulator migration, exact source backup and SHA-256 checksum, invalid-record quarantine, lifetime summary preservation, validated JSON backup preview and atomic import. Source local-storage keys and saved geometry are not modified.
- T-106: separate `timer.html` entry, Space/touch input and native-click alternative, inspection, sessions for sizes 2–5, optional manually entered scramble, result review, cumulative +2 penalties, DNF, deletion with retained revision history, statistics and paged history.
- T-107: Chromium end-to-end flows for keyboard, touch at 320 px, reload, offline entry, original simulator preservation, imports, save failure/retry, active interruption and abandoned-tab recovery. Desktop and mobile screenshots were visually reviewed.

The timer page and simulator are separate documents so their keyboard, animation and storage lifecycles cannot interfere. Both are included in the versioned offline shell. This is an incremental npm workspace; the full React/Vite application layout remains M2 work.

## Try the release

1. Open [the timer](https://rahulsinghparmar.github.io/the-cube/timer.html). If an older installed app still shows its previous release, close all its tabs/windows and reopen online once.
2. Focus the timer pad. Hold Space for at least 300 ms until it says ready; release to start. Press Space to stop. On a phone, hold/release the pad and tap to stop. Alternatively use **Start without holding** and **Stop timer**.
3. Confirm **saved locally**, a history row and a personal best. Choose **Next solve** to repeat. Complete five attempts to populate Ao5.
4. Enable inspection. Press/release once to begin inspection, then hold/release to start solving. Starting at 15 seconds adds +2; reaching 17 seconds records DNF.
5. Create another session, return to the first, and reload. Records and statistics should remain separate and persist.
6. Review a result, enter a reason and adjust its penalties/outcome. Statistics recalculate. Deletion hides a result from statistics but retains its original/revision data in exports.
7. Export JSON. Preview the same file for import: it should report existing identical records and skip them. A conflicting or damaged file must not replace current records.
8. After the page reports offline availability, disconnect and reload `timer.html`; saved history and timing remain usable. Switching away during a running solve marks it interrupted and excludes it from averages.

## Data safety and scope details

The durable recovery journal is written before timing actions. A finished attempt stays available for retry/export if IndexedDB fails. Web Locks give each tab exclusive ownership of its journal; abandoned records are recovered on the next visit. Recovery is idempotent when a previous write completed just before the tab closed. If storage cannot be opened, starting is disabled and an explicit retry/error is shown.

The default local session and deterministic legacy import IDs are compatibility identifiers; newly created sessions and attempts use UUIDs. Before M5, synchronize only through a reviewed ID/import adapter rather than sending legacy IDs to the draft account API. Legacy records retain unknown dates/scrambles and a `legacy-unknown` rule profile; zero stored penalty is not proof that a historical solve had no penalty. Imported archives are a snapshot, not continuous synchronization of future Play results.

Backup schema 1 uses canonical JSON with sorted object keys and SHA-256 payload integrity. Imports accept at most 10 MiB and 100,000 combined session/solve records, validate in batches and commit all or none. Identical IDs are skipped; different content under the same ID blocks the entire import. Current preferences take precedence; imported content metadata is preserved. Original simulator bytes and quarantine reasons have a separate **Export original simulator data** download. That raw recovery file is not a timer-backup import file.

The reference browser is Chromium; desktop and emulated mobile touch are verified. Actual iOS/Android hardware, full screen-reader certification, the broader browser matrix and performance targets remain to be measured. Timing requires a secure context with IndexedDB, local storage and Web Locks. Browser eviction or manually clearing storage can still remove records; persistent-storage requests are best effort and backups remain necessary. No account, cloud sync, automatic physical-cube scramble generator or native release is included.

## Validation and rollback

Run `npm test`, `npm run build`, `npm run check:architecture` and `npm run test:e2e`. Unit tests cover timing boundaries, ownership, trimming/DNF/PB rules, namespace isolation, transaction rollback, migration readback and import conflicts. Browser tests exercise the production bundle rather than exposing test controls in the application.

Main-branch CI publishes the tested artifact. To roll back the interface, restore a complete previous web artifact through a normal reviewed commit; leave the guest IndexedDB and recovery journals intact. The previous simulator continues reading its unchanged legacy keys. Do not downgrade/delete the database or clear site data as a rollback step.
