# Security, quality, deployment and operations

## Threat boundaries and controls

| Threat | Required control | Evidence before release |
| --- | --- | --- |
| Another user reads/edits a session by guessing UUID | Identity-derived owner filter, composite owner FK, tested authorization on every object/list/job | Two-user negative tests for reads, writes, sync, export and deletion |
| Browser credential theft or CSRF | HttpOnly secure cookies, Origin + CSRF checks, CSP, bounded sanitized content | Auth flow tests, cookie/header inspection, hostile-origin tests |
| Native token abuse | PKCE, audience/scope validation, secure token storage, expiry/revocation | Device sign-in/out and compromised/revoked-session tests |
| Malicious imports/content | Size/record/depth limits, typed schemas, plain-text rendering, all-or-none import | Oversized, malformed, duplicate, cross-reference and XSS fixtures |
| False/modified solves in public rankings | Separate self-reported/simulator/verified/official classes; immutable submissions; server validation | Replay and tamper tests; published verification policy |
| Solver/scanner gives incorrect moves | Puzzle-specific legal-state validation, input hash, independent output verification, confidence correction | Known legal/illegal state corpus and camera benchmarks |
| Camera/media exposure | Local processing by default; stop tracks; optional upload consent and short retention | Network inspection and permission lifecycle checks |
| AI prompt injection or fabricated coaching | Minimized structured data, approved content references, schema/evidence checks, no write tools | Adversarial prompts, fabricated-metric tests and deterministic fallback |
| Dependency/supply-chain compromise | Lockfiles, reviewed upgrades, license/SBOM inventory, pinned CI actions, protected secrets | Dependency analysis plus review of vendored Three.js; npm audit alone is insufficient |
| Public abuse | Block/report tools, moderated launch, quotas, private defaults and auditable roles | Abuse scenario tests and staffed escalation ownership |

Authorization must deny by default and be checked on each request, including identifiers inside nested batch payloads. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

No credential is committed or included in a web build. Use separate environments, scoped service credentials and secret rotation. CI uses read-only permissions by default; deployment jobs get narrow permissions and protected environments. Pull-request jobs do not receive production secrets. Before release, replace tag-based GitHub Action references with reviewed immutable commit SHAs and record update ownership. [GitHub secrets guidance](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

Legal documents depend on the eventual operator, jurisdictions, audience and data collected. Assign privacy/terms/cookie policy, age handling, deletion, contact/support, content rights and subscription cancellation to a pre-launch review. Do not claim GDPR compliance or copy a generic policy as proof. Preserve original code/artwork credits and resolve licensing before rebranding or monetization.

## Test strategy

| Layer | Required scenarios |
| --- | --- |
| Domain/unit | Timing boundaries and interruption; penalties/DNF/trimming; rounding; move inverse/order identities; parser rejection; impossible cube states |
| Property tests | Move followed by inverse; four quarter turns; valid-state preservation; applying every generated solution; deterministic stats under ties/edits |
| Storage integration | Transaction failure, quota denial, malformed legacy data, restart at each migration step, backup round trip, duplicate import |
| API/database | Real PostgreSQL constraints; two-user isolation; version conflicts; per-owner commit ordering; receipt replay; tombstone/snapshot expiry; export/deletion jobs |
| Browser journeys | Play/timer/learning flows; keyboard/touch parity; blur/reload; offline install/update; saved-game compatibility; cross-tab state |
| Device | Representative Android/iOS browsers and installed PWA; camera lighting/puzzle variants; mobile suspend/resume; native OS permissions |
| Accessibility | Automated checks plus keyboard-only, NVDA/VoiceOver, 200% zoom, reflow, contrast, reduced motion and color-label testing |
| Operations | Backup restore, previous-artifact rollback, interrupted deployment, database migration rollback/forward fix, upstream outage |

Test actual orientations through canonical state or transforms, not Euler representation equality. Use seeded scramble fixtures for reproducible failures plus property/random cases with recorded seeds. The first remote CI failure demonstrated why equivalent +PI/-PI Euler angles cannot be compared as raw numbers.

Target at least 90% branch coverage for new timing/statistics/cube-core packages as they mature, with all domain invariants covered. Do not inflate coverage through tests that mirror implementation; browser/device behavior and migration integrity are independent release requirements. Existing legacy coverage is lower and must be reported separately.

## Performance and reliability budgets

These are proposed test targets; benchmark and adjust with measured evidence before release.

| Area | Initial acceptance target | Test context |
| --- | --- | --- |
| Play rendering | p95 frame work under 16.7 ms on reference desktop, under 33 ms on representative mid-range phone | Warm 3×3 and 5×5 scenes, input queue and resizing |
| Input | Visible response under 100 ms p95 | Timer press feedback and move acceptance, excluding deliberate hold time |
| Web shell | Under 250 KiB compressed JS excluding lazy legacy renderer/solver/vision packs | Measure each route; do not load vision on Timer |
| Page usability | LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 as project goals | Named mobile device/network profile and field data where permitted |
| Offline data | 100,000 solve records usable with paged history; no main-thread full scan on every tick | Device storage benchmark and cancellation/progress for imports |
| API | p95 <300 ms for ordinary CRUD under 50 req/s initial load | Excludes cold starts, exports and external providers; include DB/pool saturation |
| Solver | 3×3 result within 5 s p95 after engine warm-up on reference phone, 10 s timeout | Engine selection benchmark; report unsupported/timeouts rather than blocking UI |
| Hosted account service | Proposed 99.5% monthly availability | Measured API success; offline practice is unaffected by API downtime |

Lighthouse >95 is an aspirational lab target for applicable routes, not a substitute for accessibility/device tests or a claimed current score. Avoid rebuilding stats or serializing all history on animation/timer frames. Precompute scramble/solver resources in workers. Cache public assets by content hash; never cache private API responses in the app-shell worker.

## Deployment topology

**M0–M4:** static HTTPS hosting/CDN for the web app and reviewed content packs. Build once, retain the immutable artifact, and deploy an explicit version. GitHub Pages remains viable while routes/relative assets are tested. No accounts, DB, billing server or background AI service is required.

**M5+:** static web hosting plus same-origin reverse proxy to one API service; one managed PostgreSQL database; one job worker; private object storage; managed identity provider. Start with proposed API/worker limits of 0.5–1 vCPU and 512 MiB–1 GiB each, a small managed DB and bounded connection pools; size using load tests and provider limits. These are sizing hypotheses, not reserved resources or cost quotations. No Kubernetes requirement.

Environments: local fake identities/data, isolated staging, and production. Use separate databases/buckets/provider applications and avoid copying identifiable production records to developer fixtures. Native binaries point to the correct environment explicitly. Region/provider, maximum monthly budget, recovery ownership and contact routing are decisions to settle before provisioning; no current cloud price is assumed.

## Pipeline and release gates

1. Every coherent modification gets a focused commit and push to the working branch, following [the workflow](../../CONTRIBUTING.md).
2. CI installs the lockfile, typechecks adopted TypeScript modules, validates architecture/contracts, runs domain tests, builds the web artifact, runs browser tests and uploads evidence. Add PostgreSQL integration tests when a server exists.
3. On a release candidate, validate license inventory, dependency findings, accessibility/device results, DB migration plans and staging rollback. Resolve the legacy Android workflow separately before creating release tags.
4. Publish the same reviewed artifact to staging and then production. Tag only release-ready states. A push alone does not imply a merge, app-store submission or production deployment.
5. Verify health, startup, relative paths, live/offline reload, current worker version and sample data integrity. Record artifact hash, schema version and commit SHA.

Schema changes follow expand → compatible application rollout → migrate/backfill → validate → later contract. Long migrations are resumable/idempotent jobs. Existing clients must tolerate additive fields during the support window; boundary input schemas remain versioned. Never deploy an application requiring a schema before the compatible migration is complete.

## Backups, restoration and rollback

| Asset | Proposed policy | Recovery test |
| --- | --- | --- |
| Guest/local practice | User JSON export; migration backup retained; explicit storage warning | Import into a fresh profile; counts, times, penalties and summaries match |
| PostgreSQL | Managed daily backup plus PITR where available; 30-day retention; target RPO ≤15 min / RTO ≤4 h | Monthly staging restoration and sampled ownership/history checks |
| Object storage | Versioning where needed; lifecycle expiration; private exports expire within 24 h | Restore referenced durable content without reopening expired user downloads |
| App/content artifacts | Retain at least previous three successful releases and hashes | Redeploy previous full shell, verify worker upgrade/rollback and local data compatibility |
| Secrets/identity config | Managed secret store, scoped recovery access and rotation runbook | Test rotation/revocation without restoring plaintext secrets from repo |

RPO/RTO are goals contingent on the selected provider and actual drills. API write acknowledgment follows DB commit; outbox data remains local until acknowledged. Retention must be reconciled with deletion requirements before account launch. Proposed deletion: revoke access immediately, complete primary data deletion within 30 days, expire private export files within 24 hours, and age out backups within the documented backup window. Keep a deletion ledger outside restored application backups so a restore re-applies completed deletions before reopening service. Confirm the final policy through legal/operator review.

Service-worker updates install a complete versioned shell and activate when old clients close. Do not force a mid-attempt reload. Staging tests must start from the deployed legacy worker, not only a fresh install. Rollback restores a complete artifact; it does not reverse arbitrary user data migrations. Preserve forward-compatible readers or provide a forward repair when rollback cannot read the new schema.

## Health and observability

When the backend exists: `/health/live` checks process liveness, `/health/ready` checks DB connectivity/schema compatibility; job health includes queue age, lease expiry and recent successful execution. Keep health responses free of credentials and private data. Use structured logs with request IDs; redact auth headers, raw scans, imports and sensitive coaching text.

Measure startup failures, offline cache install failures, local save failures, sync backlog/conflicts, API latency/error rate, DB connections, queue age, solver failures/timeouts, camera correction rate and per-provider spend. Alert on actionable sustained failures; suppress duplicate noise. Define one release/incident owner and an escalation route before production accounts. Error and analytics providers are adapters selected after privacy, region, sampling and cost review; do not reintroduce inherited tracking IDs.
