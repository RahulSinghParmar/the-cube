import { ordered, type Solve } from './model.js';

export type Statistic = number | 'dnf' | null;
export function effective(solve: Solve): Statistic {
  if (solve.deleted || solve.outcome === 'interrupted') return null;
  if (solve.outcome === 'dnf') return 'dnf';
  return solve.elapsedMs === null ? null : solve.elapsedMs + solve.penaltyMs;
}
export function average(solves: readonly Solve[], count: number): Statistic {
  if (!Number.isInteger(count) || count < 3) throw new Error('Invalid average size');
  const values = ordered(solves).map(effective).filter((v): v is number | 'dnf' => v !== null).slice(-count);
  if (values.length < count) return null;
  values.sort((a, b) => (a === 'dnf' ? Infinity : a) - (b === 'dnf' ? Infinity : b));
  const trim = Math.ceil(count * 0.05);
  const kept = values.slice(trim, count - trim);
  if (kept.includes('dnf')) return 'dnf';
  return (kept as number[]).reduce((sum, value) => sum + value, 0) / kept.length;
}
export function statistics(solves: readonly Solve[]) {
  const eligible = solves.map(effective).filter(v => v !== null);
  const times = eligible.filter((v): v is number => typeof v === 'number');
  return {
    count: eligible.length,
    best: times.reduce<number | null>((best, time) => best === null ? time : Math.min(best, time), null),
    mean: eligible.length === 0 ? null : eligible.includes('dnf') ? 'dnf' as const : times.reduce((a, b) => a + b, 0) / times.length,
    ao5: average(solves, 5), ao12: average(solves, 12), ao100: average(solves, 100),
  };
}
export function formatTime(value: Statistic): string {
  if (value === null) return '—';
  if (value === 'dnf') return 'DNF';
  const centiseconds = Math.round(value / 10);
  const seconds = Math.floor(centiseconds / 100);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`;
}
