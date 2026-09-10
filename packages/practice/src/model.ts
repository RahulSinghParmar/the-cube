export const RULE_VERSION = 'practice-wca-2026-04';
export const STATISTICS_VERSION = 'practice-trimmed-v1';
export const MAX_TIME = 86_400_000;
export type Outcome = 'ok' | 'dnf' | 'interrupted';
export interface Session {
  id: string;
  title: string;
  puzzle: '2' | '3' | '4' | '5';
  mode: 'physical' | 'simulator';
  createdAt: string | null;
}
export interface Revision {
  at: string;
  reason: string;
  outcome: Outcome;
  penaltyMs: number;
  deleted: boolean;
}
export interface Solve {
  id: string;
  sessionId: string;
  elapsedMs: number | null;
  penaltyMs: number;
  outcome: Outcome;
  performedAt: string | null;
  deviceId: string;
  deviceSequence: number;
  source: 'keyboard' | 'pointer' | 'accessible' | 'legacy';
  ruleVersion: string;
  scramble: string | null;
  deleted: boolean;
  revisions: Revision[];
}
export interface Snapshot {
  sessions: Session[];
  solves: Solve[];
  settings: Record<string, unknown>;
  legacySummaries: Record<string, unknown>;
  contentProgress: unknown[];
}
export function ordered(solves: readonly Solve[]): Solve[] {
  return [...solves].sort((a, b) => (a.performedAt ?? '').localeCompare(b.performedAt ?? '') ||
    a.deviceId.localeCompare(b.deviceId) || a.deviceSequence - b.deviceSequence || a.id.localeCompare(b.id));
}
