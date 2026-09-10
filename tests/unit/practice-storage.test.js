import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { PracticeRepository } from '../../packages/practice/dist/repository.js';
import { makeBackup, parseBackup } from '../../packages/practice/dist/backup.js';
import { prepareLegacy } from '../../packages/practice/dist/legacy.js';

const solve = (deviceId, id = 'attempt-1') => ({ id, sessionId: 'physical-default-3', elapsedMs: 12345, penaltyMs: 0, outcome: 'ok', performedAt: '2026-09-10T10:00:00.000Z', deviceId, deviceSequence: 0, source: 'keyboard', ruleVersion: 'practice-wca-2026-04', scramble: null, deleted: false, revisions: [] });
test('local writes survive reopen, retries deduplicate, namespaces isolate and edits detect conflicts', async () => {
  const factory = new IDBFactory(); const repo = new PracticeRepository('one', factory);
  const device = await repo.initialize(); const first = await repo.saveAttempt(solve(device));
  assert.equal(first.deviceSequence, 1); await repo.saveAttempt(solve(device));
  repo.close(); assert.equal((await repo.snapshot()).solves.length, 1);
  await repo.editSolve(first.id, first, { outcome: 'ok', penaltyMs: 2000, deleted: false }, 'Unsolved face');
  await assert.rejects(repo.editSolve(first.id, first, { outcome: 'dnf', penaltyMs: 0, deleted: false }, 'Stale edit'), /another tab/);
  const other = new PracticeRepository('two', factory); await other.initialize(); assert.equal((await other.snapshot()).solves.length, 0);
  repo.close(); other.close();
});
test('failed writes abort sequence and solve together; retry recovers', async () => {
  const repo = new PracticeRepository('failure', new IDBFactory()); const device = await repo.initialize();
  const original = IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add = function (value, key) {
    if (this.name === 'solves') throw new DOMException('Disk full', 'QuotaExceededError');
    return original.call(this, value, key);
  };
  try { await assert.rejects(repo.saveAttempt(solve(device)), /Disk full/); }
  finally { IDBObjectStore.prototype.add = original; }
  assert.equal((await repo.snapshot()).solves.length, 0);
  assert.equal((await repo.saveAttempt(solve(device))).deviceSequence, 1);
  repo.close();
});
test('legacy migration retains exact source, totals, unknown dates and quarantines invalid durations', async () => {
  const raw = { theCube_scores: JSON.stringify({ 3: { scores: [1000, -1, 'bad', 2000], solves: 800, best: 900, worst: 99000 } }), theCube_savedState: 'unchanged geometry' };
  const plan = await prepareLegacy(raw); assert.equal(plan.solves.length, 2); assert.equal(plan.quarantine.length, 2);
  assert.equal(plan.solves[0].performedAt, null); assert.deepEqual(await prepareLegacy(raw), plan);
  const repo = new PracticeRepository('migration', new IDBFactory()); await repo.initialize();
  await repo.migrate(plan); await repo.migrate(plan);
  const snapshot = await repo.snapshot(); assert.equal(snapshot.solves.length, 2); assert.equal(snapshot.legacySummaries['3'].solves, 800);
  assert.deepEqual((await repo.migrationBackup())[0].raw, raw); repo.close();
});
test('migration rollback retains no partial records or marker and a later retry succeeds', async () => {
  const repo = new PracticeRepository('migration-failure', new IDBFactory()); await repo.initialize();
  const plan = await prepareLegacy({ theCube_scores: '{"3":{"scores":[1000,2000],"solves":2}}' });
  const original = IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add = function (value, key) {
    if (this.name === 'solves' && value.elapsedMs === 2000) throw new Error('Simulated failure');
    return original.call(this, value, key);
  };
  try { await assert.rejects(repo.migrate(plan), /Simulated failure/); }
  finally { IDBObjectStore.prototype.add = original; }
  assert.equal((await repo.snapshot()).solves.length, 0); assert.equal((await repo.migrationBackup()).length, 0);
  await repo.migrate(plan); assert.equal((await repo.snapshot()).solves.length, 2); repo.close();
});
test('backup roundtrip, checksum, schema and reference validation; import conflicts roll back all records', async () => {
  const factory = new IDBFactory(); const source = new PracticeRepository('source', factory); const device = await source.initialize();
  await source.saveAttempt(solve(device)); const backup = await makeBackup(await source.snapshot());
  const parsed = await parseBackup(JSON.stringify(backup));
  const target = new PracticeRepository('target', factory); await target.initialize();
  await target.importBackup(parsed); assert.equal((await target.snapshot()).solves.length, 1);
  assert.equal((await target.importBackup(parsed)).added, 0);
  const tampered = structuredClone(backup); tampered.solves[0].elapsedMs = 1;
  await assert.rejects(parseBackup(JSON.stringify(tampered)), /checksum/);
  await assert.rejects(parseBackup(JSON.stringify({ ...backup, schemaVersion: 2 })), /Unsupported/);
  const badRef = structuredClone(backup); badRef.solves[0].sessionId = 'missing';
  await assert.rejects(parseBackup(JSON.stringify(badRef)), /Missing session/);
  const collision = structuredClone(backup); collision.sessions.unshift({ id: 'new', title: 'New session', puzzle: '3', mode: 'physical', createdAt: null });
  collision.solves[0].elapsedMs = 999;
  await assert.rejects(target.importBackup(await makeBackup(collision)), /conflicts/);
  assert.equal((await target.snapshot()).sessions.some(s => s.id === 'new'), false);
  source.close(); target.close();
});
