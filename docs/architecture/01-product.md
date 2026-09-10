# Product requirements

## Product promise and users

Help a user learn notation, practice solves, understand progress and obtain trustworthy solving guidance. Keep the existing playful simulator available throughout migration.

| Persona | Primary job | First useful outcome |
| --- | --- | --- |
| Beginner | Understand the cube and follow correct moves | Complete a notation lesson and replay a short sequence |
| Physical-cube practitioner | Record consistent practice and track progress | Save a timed solve and see an accurately defined average |
| Virtual-cube enthusiast | Manipulate a responsive simulator | Complete keyboard or touch solves without lost state |
| Intermediate speedcuber | Improve recognition and repeat algorithms | Practice a selected case and review attempt history |
| Coach/club organizer | Assign practice and review shared progress | Later: member-authorized shared sessions and drills |
| Competitive user | Prepare for events and compare results fairly | Later: separately labeled official, self-reported and verified results |

## Releases and acceptance criteria

| Requirement | Milestone | Acceptance |
| --- | --- | --- |
| P-01 Preserve existing game | Every release | 2×2–5×5 can scramble, turn, save, resume and finish; existing themes remain usable |
| P-02 Keyboard operation | M0/M2 | Supplied default bindings work; queued turns never corrupt state; remapping detects collisions and can be exported/imported |
| P-03 Physical timer | M1 | Space and touch hold/release flows behave identically; focus loss cannot produce an unnoticed trusted result |
| P-04 Inspection/penalties | M1 | Versioned rule profile, tested thresholds, editable penalty with provenance, DNF represented separately from time |
| P-05 Sessions/statistics | M1 | Create/rename/archive sessions by puzzle and mode; Ao5/Ao12/Ao100, mean, best and history explain their definitions |
| P-06 Backup/recovery | M1 | Versioned JSON round trip retains every attempt and aggregate; malformed import reports errors without overwriting data |
| P-07 Accessibility/localization | M2 onward | Full keyboard journeys, tested focus, non-color labels, zoom/reflow; English/Hindi first with a message catalog |
| P-08 Beginner academy | M3 | Versioned authored lessons, move validation, reversible steps and saved progress; no unverified generated lesson presented as reviewed content |
| P-09 Deterministic solver | M3 | Initially 3×3 only; input validity checked; all returned sequences independently solve the submitted state; cancellation works |
| P-10 Algorithm trainer | M4 | PLL before OLL/F2L; licensed provenance, valid setup/inverse, case selection, random drill and attempts |
| P-11 Accounts/sync | M5 | Guest-first usage remains; private data ownership tests pass; duplicate retries do not duplicate solves; sign-out isolates account data |
| P-12 Camera scanning | M6 | Explicit permission, guided six-face capture, manual correction, full state validation, local processing by default |
| P-13 Solve assistant | M6+ | Current/next moves and optional voice; physical move confirmation remains manual until recognition accuracy is proven |
| P-14 Progress/coach | M7 | Recommendations cite measured evidence; coarse solve times cannot be described as measured F2L/recognition splits |
| P-15 Distribution | M8 | Web PWA first; Android/iOS and Windows/macOS/Linux pass separate installation, storage, permissions and upgrade checks |

## Complete feature map

| Capability from the vision | Planned treatment |
| --- | --- |
| Custom keyboard bindings, import/export, virtual speed mode | M2 input profiles, bounded turn queue, configurable animation; no unbounded backlog |
| Space timer, inspection, PBs, best averages | M1, physical timer mode; simulator timer semantics preserved separately |
| 2×2/3×3/4×4 scanner | 3×3 at M6; 2×2 orientation ambiguity and 4×4 centers/parity require separate validators and benchmarks |
| Beginner/CFOP/Roux/ZZ solutions | M3 generic verified 3×3 solution; pedagogical methods each require their own authored solver/step model before being offered |
| Live camera assistant and voice | M6 experiment after static scan; confidence-gated confirmation and a manual fallback |
| Eight beginner lesson topics | M3 authoring plan: basics, notation, cross, first layer, second layer, last-layer orientation/permutation, complete solve review |
| PLL/OLL/F2L; COLL/CLL/ZBLL/WV/VLS | M4 curated first three sets; advanced sets depend on content licensing, validated cases and trainer demand |
| Email/Google/Apple/GitHub login; profiles/WCA ID | M5 identity adapter; enable providers individually after callback, recovery, account-linking and deletion tests |
| Cloud sync | M5; sessions/solves first, then progress, settings and collection |
| Leaderboards/daily/weekly/monthly/virtual competitions | M5+ experimental community project; explicit trust classes and moderation before public ranking |
| Friends/clubs/feed | M5+ after moderation capacity exists; private sharing before a public feed |
| WCA results/rankings and competition finder | Read-only adapter after verifying permitted sources, freshness and identity-linking; no invented official results |
| Cube collection manager | M4+ small optional module: owned cube, brand/model, setup and maintenance notes; solves may reference an item |
| AI coach and personalized plans | M7; deterministic summaries first, optional model explanations, evidence and cost budgets |
| English/Hindi/Spanish/French/German/Japanese/Chinese/Korean | Message keys from M2; reviewed translations shipped progressively; notation remains locale-independent |
| Legal/support/deletion/reporting | Privacy/data controls before accounts, moderation before posting, billing terms before paid features; jurisdiction review is a launch gate |
| Free/premium tiers | Local timer, core learning and basic solving remain useful; billing waits until validated paid benefits and entitlement/refund flows exist |
| Push notifications | M8 opt-in reminders; quiet hours and account/device revocation; no requirement for core practice |

## Core user journeys

**Practice:** open Timer → choose/create a session → obtain a practice scramble → inspect if enabled → hold/release to start → press/touch to stop → save locally → show result and statistics → optionally adjust penalty with an audit record. The next scramble is generated outside the active timing path.

**Learn:** choose a lesson → read/listen to a short instruction → perform a move on a canonical oriented cube → validate against allowed actions → show a useful correction → save progress. A reduced-motion mode can apply moves instantly.

**Solve:** enter or scan faces → correct low-confidence stickers → validate cube legality → choose a supported solving mode → solve in a worker → verify output → replay/pause/backtrack with text and optional voice. Impossible input produces an actionable correction, not a fabricated sequence.

**Sync:** practice as a guest → sign in voluntarily → review which guest records to import → create a cloud-owned copy with stable IDs and import provenance → acknowledge upload only after server commit. Switching accounts never attaches the previous account's records to the next account.

## Quality and success measures

Proposed product measures: completed practice sessions per returning user, successful first lesson, seven-day return rate, export/import success, recovered saved games, solver verification failures and sync conflict rate. Instrument only after the telemetry policy is decided; initially gather opt-in feedback and test evidence. Do not invent starting baselines or revenue forecasts.

A usable release has zero known critical correctness/data-loss defects, passes its [quality gates](06-operations.md), and has documented remaining limitations. Accounts, subscriptions, official competition submission, social moderation and native store publishing are not part of the next timer sprint.
