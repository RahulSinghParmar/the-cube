import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PracticeTimer, inspectionPenalty } from '../../packages/practice/dist/timer.js';
import { average, statistics, formatTime } from '../../packages/practice/dist/statistics.js';

test('inspection boundaries are frozen to the documented practice profile', () => {
  for (const [time, penalty, outcome] of [[14999,0,'ok'], [15000,2000,'ok'], [16999,2000,'ok'], [17000,0,'dnf']]) {
    assert.deepEqual(inspectionPenalty(time), { penaltyMs: penalty, outcome });
  }
});
test('owned press/release, repeats, short holds and stop release cannot start another solve', () => {
  let now = 0; const timer = new PracticeTimer(() => now, false);
  timer.press('space'); now = 200; timer.press('space'); timer.release('other');
  assert.equal(timer.phase, 'holding'); timer.release('space'); assert.equal(timer.phase, 'idle');
  timer.press('space'); now = 500; timer.release('space'); assert.equal(timer.phase, 'running');
  now = 1745.9; timer.press('space'); timer.release('space'); timer.press('space');
  assert.deepEqual(timer.result, { elapsedMs: 1245, penaltyMs: 0, outcome: 'ok' });
  assert.equal(timer.phase, 'review');
});
test('inspection initial release cannot start; early release continues inspection; penalty assessed at start', () => {
  let now = 0; const timer = new PracticeTimer(() => now, true);
  timer.press('touch'); timer.release('touch'); assert.equal(timer.phase, 'inspecting');
  now = 100; timer.press('touch'); now = 200; timer.release('touch'); assert.equal(timer.phase, 'inspecting');
  now = 14800; timer.press('touch'); now = 15100; timer.release('touch');
  now = 16100; timer.press('touch'); assert.equal(timer.result.penaltyMs, 2000);
  assert.equal(timer.result.elapsedMs, 1000);
});
test('focus loss, pointer cancellation, timeout and accessible activation have explicit outcomes', () => {
  let now = 0; const timer = new PracticeTimer(() => now, true);
  timer.activate(); now = 17000; timer.tick(); assert.equal(timer.result.outcome, 'dnf');
  const other = new PracticeTimer(() => now, false); other.press('p'); other.cancel(); assert.equal(other.phase, 'idle');
  other.activate(); now += 1200; other.cancel(); assert.equal(other.result.outcome, 'interrupted');
});
const solves = (count) => Array.from({ length: count }, (_, i) => ({ id: String(i), performedAt: null, deviceId: 'a', deviceSequence: i, elapsedMs: (i + 1) * 1000, penaltyMs: 0, outcome: 'ok', deleted: false }));
test('trimmed practice averages cover insufficient history, ties, DNF and exclusions', () => {
  assert.equal(average(solves(4), 5), null);
  assert.equal(average(solves(5), 5), 3000);
  assert.equal(average(solves(12), 12), 6500);
  assert.equal(average(solves(100), 100), 50500);
  const rows = solves(5); rows[0].outcome = 'dnf'; assert.equal(average(rows, 5), 4000);
  rows[1].outcome = 'dnf'; assert.equal(average(rows, 5), 'dnf');
  rows[1].outcome = 'interrupted'; assert.equal(average(rows, 5), null);
  const tied = solves(5).map(s => ({ ...s, elapsedMs: 1000 })); assert.equal(average(tied, 5), 1000);
});
test('edits and deletions recompute PB and penalties; display rounds only at the end', () => {
  const rows = solves(5); assert.equal(statistics(rows).best, 1000);
  rows[0].penaltyMs = 4000; assert.equal(statistics(rows).best, 2000);
  rows[1].deleted = true; assert.equal(statistics(rows).best, 3000);
  assert.equal(formatTime(59999), '1:00.00'); assert.equal(formatTime(null), '—');
});
