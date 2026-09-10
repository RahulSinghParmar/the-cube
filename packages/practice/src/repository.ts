import { canonical, validateSession, validateSolve, type Backup } from './backup.js';
import type { Migration } from './legacy.js';
import type { Session, Snapshot, Solve } from './model.js';
const STORES = ['meta', 'sessions', 'solves', 'migrationBackups'] as const;
type StoreName = typeof STORES[number];
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('Storage request failed')); });
}
export class PracticeRepository {
  private db: IDBDatabase | null = null;
  constructor(readonly namespace = 'guest', private readonly factory: IDBFactory = indexedDB) {}
  async open(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = this.factory.open(`the-cube-practice:${this.namespace}`, 1);
      let blocked = false;
      req.onupgradeneeded = () => {
        for (const name of STORES) req.result.createObjectStore(name, { keyPath: 'id' });
        req.transaction?.objectStore('solves').createIndex('sessionId', 'sessionId');
      };
      req.onblocked = () => { blocked = true; reject(new Error('Close other timer tabs, then retry opening storage.')); };
      req.onerror = () => reject(req.error ?? new Error('Could not open local history'));
      req.onsuccess = () => { if (blocked) { req.result.close(); return; } resolve(req.result); };
    });
    this.db.onversionchange = () => this.close();
  }
  close(): void { this.db?.close(); this.db = null; }
  private async transaction<T>(stores: StoreName[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    await this.open();
    const tx = this.db!.transaction(stores, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Local save was cancelled; nothing changed.'));
      tx.onerror = () => {}; // Abort is the authoritative failure signal.
    });
    // Observe abort immediately even if an individual request rejects first.
    void done.catch(() => {});
    try { const value = await work(tx); await done; return value; }
    catch (error) { try { tx.abort(); } catch { /* Already aborted or completed. */ } await done.catch(() => {}); throw error; }
  }
  async initialize(): Promise<string> {
    return this.transaction(['meta','sessions'], 'readwrite', async tx => {
      const meta = tx.objectStore('meta');
      const device = await request(meta.get('device')) as { id: string; value: string } | undefined;
      const deviceId = device?.value ?? crypto.randomUUID();
      if (!device) await request(meta.add({ id: 'device', value: deviceId }));
      const sessions = tx.objectStore('sessions');
      if (!(await request(sessions.get('physical-default-3')))) await request(sessions.add({ id: 'physical-default-3', title: 'Daily practice', puzzle: '3', mode: 'physical', createdAt: null } satisfies Session));
      return deviceId;
    });
  }
  async snapshot(): Promise<Snapshot> {
    return this.transaction(['meta','sessions','solves'], 'readonly', async tx => {
      const sessions = await request(tx.objectStore('sessions').getAll()) as Session[];
      const solves = await request(tx.objectStore('solves').getAll()) as Solve[];
      const meta = await request(tx.objectStore('meta').getAll()) as { id: string; value: unknown }[];
      const get = (id: string) => meta.find(row => row.id === id)?.value;
      return { sessions, solves, settings: (get('settings') ?? {}) as Record<string, unknown>, legacySummaries: (get('legacySummaries') ?? {}) as Record<string, unknown>, contentProgress: (get('contentProgress') ?? []) as unknown[] };
    });
  }
  async createSession(session: Session): Promise<void> {
    validateSession(session);
    await this.transaction(['sessions'], 'readwrite', async tx => { await request(tx.objectStore('sessions').add(session)); });
  }
  async settings(value: Record<string, unknown>): Promise<void> {
    await this.transaction(['meta'], 'readwrite', async tx => { await request(tx.objectStore('meta').put({ id: 'settings', value })); });
  }
  async saveAttempt(input: Solve): Promise<Solve> {
    validateSolve(input);
    return this.transaction(['meta','sessions','solves'], 'readwrite', async tx => {
      const store = tx.objectStore('solves');
      const existing = await request(store.get(input.id)) as Solve | undefined;
      if (existing) {
        // A retry after a successful write must not undo later edits.
        if (existing.sessionId !== input.sessionId || existing.elapsedMs !== input.elapsedMs || existing.deviceId !== input.deviceId) throw new Error('Attempt ID conflict');
        return existing;
      }
      const session = await request(tx.objectStore('sessions').get(input.sessionId)) as Session | undefined;
      if (!session || session.mode !== 'physical') throw new Error('Choose a physical practice session');
      const meta = tx.objectStore('meta');
      const seq = await request(meta.get('sequence')) as { value: number } | undefined;
      const solve = { ...input, deviceSequence: (seq?.value ?? 0) + 1 };
      await request(meta.put({ id: 'sequence', value: solve.deviceSequence }));
      await request(store.add(solve));
      const readback = await request(store.get(solve.id)) as Solve;
      if (canonical(readback) !== canonical(solve)) throw new Error('Saved result could not be verified');
      return readback;
    });
  }
  async editSolve(id: string, expected: Solve, patch: Pick<Solve, 'outcome' | 'penaltyMs' | 'deleted'>, reason: string): Promise<void> {
    await this.transaction(['solves'], 'readwrite', async tx => {
      const store = tx.objectStore('solves');
      const before = await request(store.get(id)) as Solve | undefined;
      if (!before || canonical(before) !== canonical(expected)) throw new Error('This result changed in another tab. Refresh history before editing.');
      const after: Solve = { ...before, ...patch, revisions: [...before.revisions, { at: new Date().toISOString(), reason, outcome: before.outcome, penaltyMs: before.penaltyMs, deleted: before.deleted }] };
      validateSolve(after);
      await request(store.put(after));
    });
  }
  async migrate(migration: Migration): Promise<{ count: number; quarantined: number }> {
    return this.transaction(['meta','sessions','solves','migrationBackups'], 'readwrite', async tx => {
      const meta = tx.objectStore('meta');
      const marker = await request(meta.get('legacyMigration')) as { value: { count: number; quarantined: number } } | undefined;
      if (marker) return marker.value;
      await request(tx.objectStore('migrationBackups').add({ id: migration.id, raw: migration.raw, checksum: migration.id, quarantine: migration.quarantine }));
      for (const session of migration.sessions) await request(tx.objectStore('sessions').add(session));
      for (const solve of migration.solves) {
        await request(tx.objectStore('solves').add(solve));
        if (canonical(await request(tx.objectStore('solves').get(solve.id))) !== canonical(solve)) throw new Error('Migration readback failed');
      }
      await request(meta.put({ id: 'legacySummaries', value: migration.summaries }));
      const value = { count: migration.solves.length, quarantined: migration.quarantine.length };
      await request(meta.add({ id: 'legacyMigration', value }));
      return value;
    });
  }
  async migrationBackup(): Promise<unknown[]> {
    return this.transaction(['migrationBackups'], 'readonly', tx => request(tx.objectStore('migrationBackups').getAll()));
  }
  async importBackup(backup: Backup): Promise<{ added: number; skipped: number }> {
    // The preview must use parseBackup. Conflicts are checked again in the write transaction.
    return this.transaction(['meta','sessions','solves'], 'readwrite', async tx => {
      let added = 0, skipped = 0;
      for (const [name, rows] of [['sessions', backup.sessions], ['solves', backup.solves]] as const) {
        const store = tx.objectStore(name);
        for (const row of rows) {
          const existing: unknown = await request(store.get(row.id));
          if (existing !== undefined) {
            if (canonical(existing) !== canonical(row)) throw new Error('Backup conflicts with existing records. Nothing imported; existing history preserved.');
            skipped++;
          } else { await request(store.add(row)); added++; }
        }
      }
      const meta = tx.objectStore('meta');
      // Preserve current preferences; retain imported metadata without replacing it.
      const summaries = await request(meta.get('legacySummaries')) as { value: Record<string, unknown> } | undefined;
      await request(meta.put({ id: 'legacySummaries', value: { ...backup.legacySummaries, ...summaries?.value } }));
      const preferences = await request(meta.get('settings')) as { value: Record<string, unknown> } | undefined;
      await request(meta.put({ id: 'settings', value: { ...backup.settings, ...preferences?.value } }));
      const progress = await request(meta.get('contentProgress')) as { value: unknown[] } | undefined;
      const retainedProgress = new Map([...(progress?.value ?? []), ...backup.contentProgress].map(item => [canonical(item), item]));
      await request(meta.put({ id: 'contentProgress', value: [...retainedProgress.values()] }));
      await request(meta.put({ id: `import-${backup.checksums.payload}`, value: { settings: backup.settings, contentProgress: backup.contentProgress, exportedAt: backup.exportedAt } }));
      return { added, skipped };
    });
  }
}
