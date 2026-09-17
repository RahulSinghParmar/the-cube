# P1A: find an existing tool

18 September 2026

The menu application adds **Find a tool**, also opened by Ctrl+K or Command+K.
It searches the eight sections plus lessons, F2L/OLL/PLL practice, recognition,
original cube settings/statistics, timer records/backups, About and License.
Results describe the current scope. No future catalog or course placeholders
are presented as working tools; exact algorithm lookup remains P3E.

Search is local, requires no account and adds no persistence namespace. Existing
routes and original direct-panel return links are reused. Original homepage and
timer documents are unchanged. The modal uses keyboard focus containment,
Arrow keys, Enter, Escape and touch buttons, with explicit focus restoration.
Navigation respects the existing queued-move guard. Opening it never closes an
existing confirmation dialog. No external requests or account data are involved.

## Verification

Local verification passed: 55 unit tests, type checking, production build,
architecture/coverage checks and 140 browser tests across Chromium, Firefox and
WebKit. Built-in browser inspection confirmed the search modal, filtered results
and original-panel round trip. Deployment status is reported with the release.
Targeted search tests cover all three browser engines, empty results, keyboard
selection, dismissal/focus return, narrow/tablet/desktop viewports and direct
original-panel navigation. The full suite retains saved-data/offline tests.
The [whole-product plan](21-product-coverage.md) records the broader scope;
search is the first small implementation release, not feature parity.

## Device test

1. Open [Menu](https://rahulsinghparmar.github.io/the-cube/menu.html).
2. Choose **Find a tool**, enter **PLL recognition**, and open the result.
3. Open search again; try **cube settings**. It should open the original panel
   directly. Back should return to application Settings.
4. Search **cube statistics** to reach the original trophy view, or **backups**
   for timer backup controls. Opening controls does not alter saved data.
5. On desktop try Ctrl+K/Command+K, arrows, Enter and Escape. On a phone use the
   visible search and close buttons. Try a nonexistent name to see recovery help.

Existing installed tabs may retain the prior offline version. Finish any attempt,
close all app tabs and reopen if the update notice appears.

Next: P2A shared puzzle capabilities and player, with all expanded content and
tool releases tracked in [the inventory](reference-coverage.json).
