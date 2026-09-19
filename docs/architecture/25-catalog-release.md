# P3A: unified algorithm catalog

The Algorithms section now brings the existing 21 PLL cases, 57 OLL cases and 12 beginner F2L setups into one searchable React catalog. The original simulator, theme, settings/statistics panels and existing trainer URLs remain available. P2B's keep-React decision remains in force.

## What ships

- Collection, word search, favorite and explicit-rating filters compose; filters are intentionally saved and have a visible Clear filters action. Sort by collection order or case name.
- Stable case IDs are reused verbatim. Each case has a labeled diagram, project-authored explanation, exact-orientation recognition cues, goal, source notes and the shared reversible 3D player.
- Ninety existing face-turn versions plus **29 qualified reference-notation variants**. These are alternate executions/notations of existing algorithms, not 29 new cases. Reference versions use slices, wide turns or rotations where applicable. Other original references need orientation adaptation and are deliberately excluded.
- Per-case favorites, favorite collections, preferred versions, and separate case/variant ratings: New, Learning, Comfortable. They are explicit self-assessments. Watching, seeking or completing a demonstration never changes ratings or guided repetitions.
- Trainers expose the same case and face-turn-variant ratings. Practice this case opens the exact existing case; guided practice retains its existing sequence, counters and stable IDs. Reference-notation variants are viewable in the catalog; guided variant execution is not part of this release.
- Saved notation font/spacing, four recognized trigger labels, preferred reference notation, and an optional distinct-color catalog palette with face letters. Reset notation affects only these preferences. Colors do not replace the visible face identities. The original simulator and trainer 3D colors remain unchanged.
- Guest catalog JSON backup/restore and recovery controls. No account or backend is required.

## Verification and provenance

`packages/academy/src/library.ts` adapts the existing catalogs. Its explicit variant allowlist is checked against the frozen fixtures and existing PLL/OLL/F2L stage predicates. Every variant must produce exactly the baseline final state, including center orientation and final adjustment. Runtime verification disables playback on failure.

Unit tests independently apply all **119 versions** with the existing licensed cubejs engine, comparing fixture results and full permutations on solved and scrambled states. This goes beyond generating a setup by inverting the same algorithm. Trigger grouping must reconstruct the unchanged move stream. Ratings, preferred-version fallback, composite search and malformed storage are also checked.

The existing [PLL](https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf) and [OLL](https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf) references credit Feliks Zemdegs and Andy Klise. [F2L tutorials](https://www.cubeskills.com/tutorials/f2l) are a learning reference; the twelve guided setups and explanations are project-authored. Reference PDFs, illustrations, video and explanatory prose are not imported. Links/credits are not an open-source reuse license. Existing third-party notices and the repository's current license limitations remain explicit on About/License.

## Storage and navigation contract

The additive key is `the-cube-catalog-v1:<base path>`. Its schema contains version, per-case preferences, favorite sets, notation and filters. Existing simulator, practice, PLL, OLL, F2L, lesson, recognition and physical-timer records are not migrated. Opening a case in its trainer changes only that trainer's selected case through its existing safe storage hook.

Strict validation rejects unknown versions, IDs and invalid values without overwriting original bytes. Storage failures remain recoverable; competing tabs cannot silently overwrite one another. Restoring catalog data does not restore or replace trainer progress. Catalog viewing position is temporary and restarts at zero on reload; guided practice retains its existing saved-step behavior.

Existing `menu.html#/algorithms`, `#/train`, `#/oll` and `#/f2l` work. Optional `?case=<stable ID>` belongs inside the hash and adds direct case links without a server route. Unknown case links fall back visibly. Original `?panel=settings` and `?panel=stats` URLs are unchanged. Lazy-loaded catalog files join the existing generated offline cache; upgrades retain the waiting-worker lifecycle.

## Validation and device checks

The release includes unit/type/build checks and Chromium, Firefox and WebKit tests for saved filters, variant playback, explicit ratings, trainer handoff, unreadable/concurrent storage, responsive layout, accessibility and offline use. The existing trainer, navigation, player, preservation and update suites remain release gates. Built-in browser inspection covers actual rendered diagrams/3D, search, reload persistence and trainer handoff.

Automated viewports cover 320, 820 and 1440 px. This is not physical phone or screen-reader certification. Check touch dragging and controls on actual iPhone/iPad/Android, and assess the optional palette with users who have different color-vision needs; labeled face grids remain available.

## Try it

1. Open **Menu → Algorithms**. Search **Sune**, then select OLL 27. Clear filters to return to all 90 cases.
2. Open **H permutation**, choose its reference-notation version and use Next, Previous, Play and the timeline. Its first move is M2.
3. Favorite the case and set the case/variant ratings. Reload: those choices remain; playback starts at zero.
4. Choose **Practice this case**. The correct trainer opens with its existing repetitions unchanged. Expand Favorites, ratings & notation to see the shared self-rating.
5. Change Notation preferences, inspect the live preview, then Reset notation only. Favorites and ratings remain. Settings also links to these controls.
6. Export a catalog backup. After the app has cached once, reload offline and try playback. For an update, close old app tabs and reopen; do not clear browser storage.

## Remaining scope

This delivers the requested P3A catalog slice. F2L remains twelve beginner setups, not the full taxonomy. Only the explicitly qualified reference variants ship. General commutator/conjugate expression parsing, arbitrary mirrored/equivalent algorithm lookup and advanced notation remain tracked as partial/future work; four trigger labels are not a general parser. No accounts, smart-cube pairing or additional puzzle packs ship here.

Next: **P3B**, beginning with a verified 2×2 Ortega catalog batch. Preserve these identities and storage contracts when adding later packs.
