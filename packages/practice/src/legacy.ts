import { checksum } from './backup.js';
import { MAX_TIME, type Session, type Solve } from './model.js';
export const LEGACY_KEYS = ['theCube_version','theCube_scores','theCube_scoresData','theCube_scoresBest','theCube_scoresWorst','theCube_scoresSolves','theCube_playing','theCube_savedState','theCube_time','theCube_preferences'];
export interface Migration {
  id: string; raw: Record<string, string | null>; sessions: Session[]; solves: Solve[];
  summaries: Record<string, unknown>; quarantine: { location: string; reason: string }[];
}
export async function prepareLegacy(raw: Record<string, string | null>): Promise<Migration> {
  const digest = await checksum(raw);
  const migration: Migration = { id: digest, raw, sessions: [], solves: [], summaries: {}, quarantine: [] };
  const quarantine = (location: string, reason: string) => migration.quarantine.push({ location, reason });
  let data: unknown = {};
  try {
    if (raw.theCube_scores) data = JSON.parse(raw.theCube_scores);
    else if (raw.theCube_scoresData) data = { '3': { scores: JSON.parse(raw.theCube_scoresData), best: raw.theCube_scoresBest, worst: raw.theCube_scoresWorst, solves: raw.theCube_scoresSolves } };
  } catch { quarantine('scores', 'Invalid JSON; exact original retained'); }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) { quarantine('scores', 'Expected cube-size records'); return migration; }
  for (const [size, group] of Object.entries(data)) {
    if (!['2','3','4','5'].includes(size) || group === null || typeof group !== 'object') { quarantine(size, 'Unsupported cube size or record'); continue; }
    const entry = group as Record<string, unknown>;
    migration.summaries[size] = { best: entry.best ?? null, worst: entry.worst ?? null, solves: entry.solves ?? null, source: 'legacy' };
    if (!Array.isArray(entry.scores)) { quarantine(size, 'Missing score array'); continue; }
    if (entry.scores.length === 0 && !entry.solves) continue;
    const sessionId = `legacy-${digest.slice(0, 24)}-${size}`;
    migration.summaries[sessionId] = migration.summaries[size];
    migration.sessions.push({ id: sessionId, title: `Imported ${size}×${size} simulator`, puzzle: size as Session['puzzle'], mode: 'simulator', createdAt: null });
    for (const [index, elapsedMs] of entry.scores.entries()) {
      if (typeof elapsedMs !== 'number' || !Number.isSafeInteger(elapsedMs) || elapsedMs < 0 || elapsedMs > MAX_TIME) { quarantine(`${size}.${index}`, 'Invalid duration'); continue; }
      migration.solves.push({ id: `${sessionId}-${index}`, sessionId, elapsedMs, penaltyMs: 0, outcome: 'ok', performedAt: null, deviceId: 'legacy', deviceSequence: index, source: 'legacy', ruleVersion: 'legacy-unknown', scramble: null, deleted: false, revisions: [] });
    }
  }
  return migration;
}
