-- Proposed PostgreSQL core schema, architecture v1.0.
-- Design reference only: not wired into the application or an applied migration.
-- API/services must supply server timestamps, authenticated owner IDs, version
-- preconditions, immutable-field checks, feed writes and role/RLS configuration.
BEGIN;

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  display_name varchar(80) NOT NULL,
  locale varchar(20) NOT NULL DEFAULT 'en',
  deletion_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(display_name)) > 0)
);

CREATE TABLE auth_identities (
  issuer text NOT NULL,
  subject text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (issuer, subject)
);
CREATE INDEX auth_identities_owner_idx ON auth_identities(owner_id);

CREATE TABLE practice_sessions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title varchar(120) NOT NULL,
  puzzle varchar(3) NOT NULL CHECK (puzzle IN ('222','333','444','555')),
  mode varchar(12) NOT NULL CHECK (mode IN ('physical','simulator')),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, id),
  CHECK (length(trim(title)) > 0)
);
CREATE INDEX practice_sessions_owner_updated_idx ON practice_sessions(owner_id, updated_at, id);

CREATE TABLE solves (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  elapsed_ms integer CHECK (elapsed_ms BETWEEN 0 AND 86400000),
  outcome varchar(12) NOT NULL CHECK (outcome IN ('ok','dnf','interrupted')),
  penalty_ms integer NOT NULL DEFAULT 0 CHECK (penalty_ms BETWEEN 0 AND 86400000 AND penalty_ms % 2000 = 0),
  source varchar(12) NOT NULL CHECK (source IN ('timer','simulator','manual')),
  scramble text CHECK (length(scramble) <= 4096),
  scramble_generator varchar(120),
  rule_version varchar(80) NOT NULL,
  inspection_ms integer CHECK (inspection_ms BETWEEN 0 AND 86400000),
  performed_at timestamptz NOT NULL,
  device_id uuid NOT NULL,
  device_sequence integer NOT NULL CHECK (device_sequence >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, id),
  FOREIGN KEY (owner_id, session_id) REFERENCES practice_sessions(owner_id, id),
  CHECK (outcome <> 'ok' OR elapsed_ms IS NOT NULL),
  CHECK (length(rule_version) > 0)
);
CREATE INDEX solves_session_order_idx ON solves(owner_id, session_id, performed_at, device_id, device_sequence, id);

CREATE TABLE solve_revisions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  solve_id uuid NOT NULL,
  previous_version integer NOT NULL CHECK (previous_version > 0),
  changed_fields jsonb NOT NULL CHECK (jsonb_typeof(changed_fields) = 'object'),
  reason varchar(500) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (owner_id, solve_id) REFERENCES solves(owner_id, id) ON DELETE CASCADE
);
CREATE INDEX solve_revisions_solve_idx ON solve_revisions(owner_id, solve_id, created_at);

-- Minimal identity markers survive entity deletion while the account exists.
-- Deletes insert a marker/change before removing payload and revision records.
CREATE TABLE entity_tombstones (
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type varchar(12) NOT NULL CHECK (entity_type IN ('session','solve')),
  entity_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  deleted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, entity_type, entity_id)
);

CREATE TABLE sync_heads (
  owner_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_sequence bigint NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  oldest_sequence bigint NOT NULL DEFAULT 0 CHECK (oldest_sequence >= 0),
  CHECK (oldest_sequence <= last_sequence)
);

CREATE TABLE sync_changes (
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sequence bigint NOT NULL CHECK (sequence > 0),
  entity_type varchar(12) NOT NULL CHECK (entity_type IN ('session','solve')),
  entity_id uuid NOT NULL,
  entity_version integer NOT NULL CHECK (entity_version > 0),
  operation varchar(8) NOT NULL CHECK (operation IN ('upsert','delete')),
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, sequence),
  CHECK ((operation = 'delete' AND payload IS NULL)
      OR (operation = 'upsert' AND payload IS NOT NULL AND jsonb_typeof(payload) = 'object'))
);
CREATE INDEX sync_changes_retention_idx ON sync_changes(created_at);

CREATE TABLE sync_mutations (
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mutation_id uuid NOT NULL,
  request_hash char(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  result jsonb NOT NULL CHECK (jsonb_typeof(result) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (owner_id, mutation_id),
  CHECK (expires_at > created_at)
);
CREATE INDEX sync_mutations_expiry_idx ON sync_mutations(expires_at);

-- Snapshot pages are materialized under a consistent DB snapshot. Opaque page
-- tokens bind to owner+snapshot+page and expire together; no public object URLs.
CREATE TABLE sync_snapshots (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  watermark bigint NOT NULL CHECK (watermark >= 0),
  page_count integer NOT NULL CHECK (page_count > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE TABLE sync_snapshot_pages (
  snapshot_id uuid NOT NULL REFERENCES sync_snapshots(id) ON DELETE CASCADE,
  page_number integer NOT NULL CHECK (page_number >= 0),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  PRIMARY KEY (snapshot_id, page_number)
);

COMMIT;

-- Before production: add tested tenant RLS under a non-owner runtime role;
-- protect identity/receipt/change/snapshot writes from direct client access;
-- enforce API entity schemas in addition to the broad jsonb CHECK constraints;
-- test per-owner locked sequence allocation, parent deletion ordering and
-- rollback, receipt expiry, auth isolation, realistic indexes and restoration.
