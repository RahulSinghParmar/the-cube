import { MAX_TIME, type Session, type Snapshot, type Solve } from './model.js';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const MAX_RECORDS = 100_000;
export interface Backup extends Snapshot {
  format: 'the-cube-backup'; schemaVersion: 1; exportedAt: string; applicationVersion: string;
  compatibility: { minimumSchemaVersion: 1 }; checksums: { payload: string };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function checksum(value: unknown): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value))))).map(b => b.toString(16).padStart(2, '0')).join('');
}
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value: unknown, max = 150): value is string { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function member(value: unknown, allowed: string[]): boolean { return typeof value === 'string' && allowed.includes(value); }
function date(value: unknown): boolean { return value === null || (typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value); }
function integer(value: unknown, max = MAX_TIME): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max; }
export function validateSession(value: unknown): asserts value is Session {
  if (!record(value) || !text(value.id) || !text(value.title, 80) || !member(value.puzzle, ['2','3','4','5']) || !member(value.mode, ['physical','simulator']) || !date(value.createdAt)) throw new Error('Invalid session in backup');
}
export function validateSolve(value: unknown): asserts value is Solve {
  if (!record(value) || !text(value.id) || !text(value.sessionId) || !integer(value.penaltyMs) || value.penaltyMs % 2000 !== 0 ||
      !member(value.outcome, ['ok','dnf','interrupted']) || (value.elapsedMs !== null && !integer(value.elapsedMs)) ||
      (value.outcome === 'ok' && value.elapsedMs === null) || !date(value.performedAt) || !text(value.deviceId) || !integer(value.deviceSequence, Number.MAX_SAFE_INTEGER) ||
      !member(value.source, ['keyboard','pointer','accessible','legacy']) || !text(value.ruleVersion) || typeof value.deleted !== 'boolean' ||
      !(value.scramble === null || (typeof value.scramble === 'string' && value.scramble.length <= 2000)) || !Array.isArray(value.revisions) || value.revisions.length > 1000) throw new Error('Invalid solve in backup');
  if (value.source !== 'legacy' && value.performedAt === null) throw new Error('Practice records require a date');
  for (const revision of value.revisions) {
    if (!record(revision) || revision.at === null || !date(revision.at) || !text(revision.reason, 500) || !member(revision.outcome, ['ok','dnf','interrupted']) || !integer(revision.penaltyMs) || revision.penaltyMs % 2000 !== 0 || typeof revision.deleted !== 'boolean') throw new Error('Invalid solve revision');
  }
}
export function payload(snapshot: Snapshot): Snapshot {
  return { sessions: snapshot.sessions, solves: snapshot.solves, settings: snapshot.settings, legacySummaries: snapshot.legacySummaries, contentProgress: snapshot.contentProgress };
}
export async function makeBackup(snapshot: Snapshot): Promise<Backup> {
  const data = payload(snapshot);
  return { format: 'the-cube-backup', schemaVersion: 1, exportedAt: new Date().toISOString(), applicationVersion: 'm1-v1', compatibility: { minimumSchemaVersion: 1 }, ...data, checksums: { payload: await checksum(data) } };
}
export async function parseBackup(input: string): Promise<Backup> {
  if (new TextEncoder().encode(input).byteLength > MAX_BACKUP_BYTES) throw new Error('Backup exceeds 10 MiB');
  const value: unknown = JSON.parse(input);
  if (!record(value) || value.format !== 'the-cube-backup' || value.schemaVersion !== 1 || !date(value.exportedAt) || value.exportedAt === null || !text(value.applicationVersion) ||
      !Array.isArray(value.sessions) || !Array.isArray(value.solves) || value.sessions.length + value.solves.length > MAX_RECORDS ||
      !record(value.settings) || !record(value.legacySummaries) || !Array.isArray(value.contentProgress) || !record(value.checksums) || !record(value.compatibility) || value.compatibility.minimumSchemaVersion !== 1) throw new Error('Unsupported or invalid backup');
  const sessions = new Map<string, Session>();
  for (const session of value.sessions) { validateSession(session); if (sessions.has(session.id)) throw new Error('Duplicate session ID'); sessions.set(session.id, session); }
  const ids = new Set<string>();
  for (let i = 0; i < value.solves.length; i++) {
    const solve: unknown = value.solves[i]; validateSolve(solve);
    if (!sessions.has(solve.sessionId) || ids.has(solve.id)) throw new Error('Missing session or duplicate solve ID');
    if (solve.source === 'legacy' && sessions.get(solve.sessionId)?.mode !== 'simulator') throw new Error('Legacy records require a simulator session');
    ids.add(solve.id);
    if (i % 500 === 499) await new Promise(resolve => setTimeout(resolve, 0));
  }
  const backup = value as unknown as Backup;
  if (await checksum(payload(backup)) !== value.checksums.payload) throw new Error('Backup checksum does not match. No data imported.');
  return backup;
}
