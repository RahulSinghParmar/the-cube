# API and worker contracts

## Contract scope

[openapi.json](openapi.json) is an OpenAPI 3.1.1 design for the M5 private practice API. It covers profile reads, session/solve reads and versioned writes, deletion, change push/pull and consistent bootstrap snapshots. It is not a running service. [OpenAPI specification](https://spec.openapis.org/oas/v3.1.1.html).

Account-provider login/callback/logout endpoints depend on the selected provider and are intentionally outside this resource contract. The remaining product APIs have a staged registry below, so the first server does not accidentally claim complete community or scanner functionality.

## Transport, authentication and ownership

- Serve the web API under the same origin at `/api/v1`. Production requires HTTPS. The OpenAPI relative server URL is suitable for a local mock and does not name a provisioned host.
- Browser requests use a Secure, HttpOnly, SameSite session cookie obtained by a backend login flow. Mutating browser requests also require a session-bound CSRF header and trusted Origin validation. Never store browser refresh tokens in local storage.
- Native clients use authorization-code/PKCE with a managed identity provider and short-lived bearer access tokens scoped/audienced for this API; refresh credentials belong in OS secure storage. The API validates issuer, audience, signature, expiry and intended scopes. A browser session cookie and CSRF header are one security alternative; a valid bearer token is the other. Provider endpoints and actual scopes are pinned at M5.
- Derive ownership from authenticated identity; no request schema accepts `ownerId`. A cross-owner ID is returned as 404 to avoid revealing private records. Admin/moderator actions use separate capabilities and audit trails.
- Reject unknown fields, invalid enum values, negative/oversized durations and oversized bodies. Return bounded error details without stack traces, tokens or another user's data.

## Resource conventions

`PUT` creates/updates a client-ID resource. New entities use `baseVersion=0`; existing writes require the exact current version. Require `Idempotency-Key` (a mutation UUID) on resource writes. `DELETE` requires the same header and a `baseVersion` query parameter. Writes return a mutation receipt so replay after a lost response is unambiguous. Use the same application service as batch sync: successful writes append to the change feed atomically.

Updating an existing solve also requires a nonempty `reason` (maximum 500 characters), persisted with its revision. The same requirement applies to a solve upsert in a sync batch. Reusing a mutation ID with a different request yields 409 `mutation_id_reused` as a Problem response on resource writes, or a rejected receipt inside a batch; it is distinct from a version conflict with an existing record.

List endpoints use opaque keyset cursors, `limit` default 50/max 200 and stable ordering. Their ordinary pages are for browsing, not a consistent full export: sync clients use snapshots. There are no unbounded `GET all solves` calls. UTC dates and raw integer milliseconds appear in JSON. Versions fit signed 32-bit integers; sequence watermarks are decimal strings. A server approaching version exhaustion must migrate the version representation before accepting further edits.

| Status | Meaning | Client action |
| --- | --- | --- |
| 200 | Successful read, idempotent write receipt or processed batch | Persist receipt/cursor with local changes |
| 400 | Malformed request or unknown fields | Correct request; no automatic retry |
| 401 | Login missing/expired | Preserve outbox; reauthenticate |
| 403 | Invalid CSRF or forbidden capability | Stop and show actionable error |
| 404 | Missing or inaccessible record | Reconcile; do not reveal other owners |
| 409 | Version conflict / reused mutation ID / deleted identity | Preserve local proposal and show conflict |
| 410 | Expired change cursor or snapshot | Bootstrap a new consistent snapshot |
| 413 | Body or import too large | Split allowed batches or use import flow |
| 422 | Structurally valid but invalid domain operation | Surface reason; no blind retry |
| 429 | Rate limit | Honor Retry-After and retry with jitter |
| 503 | Transient service unavailable | Keep local practice working and retry later |

Errors contain `{code, message, requestId}` and optionally bounded details. Conflict responses contain a mutation receipt with the current record or deletion version. Batch push returns HTTP 200 when processing succeeds, with `applied`, `conflict` or `rejected` per mutation; HTTP 200 does not mean every mutation was applied. `rejected` has a typed error code; the transport may still return 4xx for an invalid whole batch.

## Example

```http
PUT /api/v1/sessions/77cf8ab2-3828-47db-bf31-d572e606b1c2
Idempotency-Key: 7d2f5875-b598-4f44-bbd9-50be1e76ccad
X-CSRF-Token: <session-bound token>
Content-Type: application/json

{"baseVersion":0,"data":{"title":"3x3 practice","puzzle":"333","mode":"physical","archivedAt":null}}
```

The response is an applied receipt with the entity ID, version 1 and canonical record. Retrying the same mutation returns that receipt. Editing it later uses a new mutation UUID and version 1. A concurrent edit produces 409 with version 2/current data; the client preserves its proposal rather than overwriting it.

## Sync semantics

See [data synchronization](03-data.md) for transaction ordering, receipts, tombstones, cursor retention and account switching. Push has a maximum of 100 mutations and 256 KiB. Parent session mutations precede dependent solves. Cross-entity operations are not automatically atomic across a batch.

A session deletion tombstones child solves and the session in one transaction if it has at most 1,000 solves. Above that limit, v1 returns 422 `deletion_job_required`; keep the session archived until the bounded deletion job API is introduced. This avoids an unbounded request and does not silently orphan children. Deletion remains an explicit user action distinct from archiving.

`GET /sync/changes` requires a cursor from a snapshot or earlier response. `GET /sync/snapshot` without a page token starts a consistent snapshot; subsequent requests use its opaque token. When the final page has been applied, adopt `resumeCursor` and pull subsequent changes. Tokens are authenticated/owner-bound, not raw SQL offsets.

## Internal worker protocol

Workers are local computations, not HTTP APIs and do not need user accounts.

| Direction | Message | Behavior |
| --- | --- | --- |
| UI → solver | `solve {requestId, state, stateHash, engineVersion, method, deadlineMs}` | Validate/cap input, version and supported puzzle/method |
| solver → UI | `progress {requestId, stage}` | Coarse bounded events, not every search node |
| solver → UI | `solution {requestId, stateHash, moves, engineVersion, method}` | Independently verify before displaying; discard stale input hash |
| UI → worker | `cancel {requestId}` | Cooperate when possible; otherwise terminate worker and reclaim buffers |
| worker → UI | `error {requestId, code}` | Codes include invalid_state, unsupported, timeout, engine_unavailable |
| UI → vision | `classify {requestId, faceId, imageBuffer, calibrationVersion}` | Transfer bounded/cropped pixels; no automatic network upload |
| vision → UI | `face {requestId, colors, confidence, orientation}` | Ask for correction if uncertainty exceeds benchmarked limits |

Use JSON Schema/generated types at the message boundary. Request IDs correlate concurrent work; hashes pin the exact input. Never execute model/content-provided JavaScript or HTML as instructions.

## Future endpoint registry

| Module / milestone | Planned endpoints | Key constraints |
| --- | --- | --- |
| Accounts / M5 | `/auth/*`, `GET/PATCH /me`, `POST /me/exports`, `DELETE /me`, `/jobs/{id}` | Reauthentication for deletion, private job output, token revocation and auditable completion |
| Imports / M5 | `POST /imports/preview`, `POST /imports/{id}/commit` | Schema/version/hash validation, previewed ownership, idempotent commit; preserve unknown legacy dates |
| Content / M3–M5 | `GET /courses`, `/lessons/{id}`, `/algorithms`, `/content-manifest` | Static versioned content first; immutable content versions/cache validation; provenance |
| Progress / M5+ | `/lesson-progress`, `/training-attempts` | Authenticated ownership, valid lesson/case version, extend sync contracts before shipping |
| Collection / M4+ | `/collection`, `/collection/{id}/maintenance` | Private by default, bounded notes, optional solve association |
| Sharing / M5+ | `/shares`, `/follows`, `/blocks`, `/clubs`, `/clubs/{id}/members` | Explicit visibility, membership roles, block enforcement, revocable sharing |
| Community / M5+ | `/posts`, `/reports`, `/moderation/actions` | Abuse prevention, moderation capacity, media scanning, rate limits |
| Competition / M5+ | `/challenges`, `/challenges/{id}/entries`, `/leaderboards` | Server time window, immutable entries, trust labels, anti-replay and auditable ranking |
| WCA / M5+ | `/external/wca/profiles/{id}`, `/external/wca/competitions` | Read-only source adapter, freshness, caching, upstream limits and identity verification |
| Coaching / M7 | `POST /coach/plans`, `/coach/plans/{id}`, `/coach/feedback` | Async job, evidence, consent, quotas, provider outage fallback |
| Billing / later | `/billing/checkout`, `/billing/portal`, `/webhooks/billing` | Signed webhook verification, deduplication, server entitlements and refund state |
| Notifications / M8 | `/devices`, `/push-subscriptions`, `/notification-preferences` | Per-device revocation, explicit opt-in, quiet hours |

Each new module must extend the schema, API specification, authorization matrix and tests before exposing an endpoint. Scanner media upload is not a default endpoint: introduce it only for an explicitly opted-in feature with a retention policy.
