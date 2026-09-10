import { canonical, makeBackup, parseBackup, validateSolve, MAX_BACKUP_BYTES, type Backup } from './backup.js';
import { LEGACY_KEYS, prepareLegacy } from './legacy.js';
import { ordered, RULE_VERSION, type Session, type Snapshot, type Solve } from './model.js';
import { PracticeRepository } from './repository.js';
import { effective, formatTime, statistics } from './statistics.js';
import { PracticeTimer } from './timer.js';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id); if (!found) throw new Error(`Missing element ${id}`); return found as T;
}
const pad = el<HTMLButtonElement>('timer-pad');
const picker = el<HTMLSelectElement>('session');
const inspection = el<HTMLInputElement>('inspection');
const scramble = el<HTMLTextAreaElement>('scramble');
const repo = new PracticeRepository(`guest:${location.pathname.replace(/[^/]*$/, '')}`);
let snapshot: Snapshot = { sessions: [], solves: [], settings: {}, legacySummaries: {}, contentProgress: [] };
let machine = new PracticeTimer(() => performance.now(), false);
let deviceId = '', selected = 'physical-default-3', journalKey = '';
const journalPrefix = `the-cube-practice-pending:${location.pathname}:`;
let releaseJournal: (() => void) | null = null;
let ready = false, saving = false, saved = false, importing = false, opening = false;
let attempt: Solve | null = null, editing: Solve | null = null, preview: Backup | null = null;
let limit = 50, lastPhase = '', frame = 0;
let pointerId: number | null = null;
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(`the-cube-practice:${location.pathname}`);
function message(text: string, error = false): void { el('status').textContent = text; el('status').classList.toggle('error', error); }
function dataMessage(text: string, error = false): void { el('data-status').textContent = text; el('data-status').classList.toggle('error', error); }
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
async function ownJournal(): Promise<void> {
  if (journalKey) return;
  if (!navigator.locks) throw new Error('This browser cannot safely coordinate recovery between tabs. Use a current browser with Web Locks support.');
  const key = `${journalPrefix}${crypto.randomUUID()}`;
  await new Promise<void>((resolve, reject) => {
    void navigator.locks.request(key, async () => {
      journalKey = key;
      resolve();
      await new Promise<void>(release => { releaseJournal = release; });
    }).catch(reject);
  });
}
async function recoverJournals(): Promise<number> {
  const keys = Object.keys(localStorage).filter(key => key.startsWith(journalPrefix) && !key.endsWith(':check') && key !== journalKey);
  let count = 0;
  for (const key of keys) {
    // A live tab owns its journal. Only recover abandoned records, including closed tabs.
    await navigator.locks.request(key, { ifAvailable: true }, async lock => {
      if (!lock) return;
      const raw = localStorage.getItem(key); if (!raw) return;
      const value: unknown = JSON.parse(raw); validateSolve(value);
      await repo.saveAttempt(value);
      localStorage.removeItem(key); count++;
    });
  }
  return count;
}
function session(): Session | undefined { return snapshot.sessions.find(s => s.id === selected); }
function locked(): boolean { return !ready || machine.active || saving || importing || (machine.phase === 'review' && !saved); }
function controls(): void {
  const lock = locked();
  for (const id of ['session','new-session','inspection','scramble','refresh','import-file','persistent','legacy-export']) (el(id) as HTMLInputElement | HTMLButtonElement).disabled = lock;
  pad.disabled = !ready || importing || saving || machine.phase === 'review' || session()?.mode !== 'physical';
  el<HTMLButtonElement>('simple-control').disabled = pad.disabled || machine.phase === 'holding' || machine.phase === 'inspectionPress';
  el<HTMLButtonElement>('export').disabled = !ready || machine.active || importing;
  el('next').hidden = machine.phase !== 'review' || !saved;
  el('retry-save').hidden = machine.phase !== 'review' || saved || saving;
  for (const button of document.querySelectorAll<HTMLButtonElement>('#history button')) button.disabled = lock;
}
function display(): void {
  const phase = machine.phase;
  const inspecting = phase === 'inspecting' || (phase === 'holding' && inspection.checked);
  const phaseText = phase === 'review' ? 'Attempt recorded' : phase === 'running' ? 'Solving' : machine.armed ? 'Ready — release to start' : phase === 'holding' ? 'Keep holding…' : inspecting ? machine.inspectionElapsed >= 15000 ? 'Inspection · +2 seconds' : 'Inspect your cube' : phase === 'inspectionPress' ? 'Release to inspect' : 'Ready when you are';
  el('phase').textContent = phaseText;
  if (machine.phase === 'review' && !saved) el('phase').textContent = saving ? 'Saving your attempt…' : 'Attempt needs saving';
  el('timer-display').textContent = inspecting ? `${Math.max(0, 15 - Math.floor(machine.inspectionElapsed / 1000))}` : machine.result?.outcome === 'dnf' ? 'DNF' : formatTime(machine.elapsed);
  el('pad-hint').textContent = phase === 'running' ? 'Press to stop' : inspecting ? 'Hold until ready, then release' : phase === 'review' ? saved ? 'Saved on this device' : 'Keep this page open until saved' : inspection.checked ? 'Press and release to inspect' : 'Hold, then release to start';
  pad.dataset.phase = phase; pad.dataset.armed = String(machine.armed);
  if (session()?.mode === 'simulator') { el('phase').textContent = 'Simulator archive'; el('pad-hint').textContent = 'Choose a physical practice session to use the timer'; }
  el('simple-control').textContent = phase === 'running' ? 'Stop timer' : phase === 'inspecting' ? 'Start solve without holding' : inspection.checked ? 'Start inspection' : 'Start without holding';
  const announcement = `${phase}:${machine.armed}:${machine.inspectionElapsed >= 15000}`;
  if (announcement !== lastPhase && machine.active) { el('result').textContent = phaseText; lastPhase = announcement; }
  controls();
}
function journal(): void {
  if (!attempt) return;
  const recovery: Solve = { ...attempt, ...(machine.result ?? { outcome: 'interrupted' as const, elapsedMs: machine.phase === 'running' ? machine.elapsed : null, penaltyMs: 0 }) };
  localStorage.setItem(journalKey, JSON.stringify(recovery));
}
function newAttempt(source: Solve['source']): void {
  if (attempt) return;
  attempt = { id: crypto.randomUUID(), sessionId: selected, elapsedMs: null, penaltyMs: 0, outcome: 'interrupted', performedAt: new Date().toISOString(), deviceId, deviceSequence: 0, source, ruleVersion: RULE_VERSION, scramble: scramble.value.trim() || null, deleted: false, revisions: [] };
}
function advance(action: () => void, source: Solve['source']): void {
  if (!ready || saving || importing || machine.phase === 'review' || session()?.mode !== 'physical') return;
  try {
    newAttempt(source);
    // Persist the recovery record before allowing the timing action.
    journal(); action(); journal();
    if (machine.phase === 'idle') { localStorage.removeItem(journalKey); attempt = null; }
    if (machine.result) void saveResult();
  } catch (error) {
    machine.cancel();
    message(`Recovery storage is unavailable. ${errorText(error)} Export any pending result and retry.`, true);
    if (machine.result) void saveResult();
    else { attempt = null; ready = false; el('retry-open').hidden = false; }
  }
  display(); schedule();
}
function schedule(): void {
  if (frame || !machine.active) return;
  frame = requestAnimationFrame(() => {
    frame = 0; machine.tick(); display();
    if (machine.phase === 'review') { try { journal(); } catch { /* The earlier interruption marker remains. */ } void saveResult(); }
    else schedule();
  });
}
async function saveResult(): Promise<void> {
  if (!attempt || !machine.result || saving || saved) return;
  attempt = { ...attempt, ...machine.result };
  saving = true; display();
  try {
    const record = await repo.saveAttempt(attempt);
    saved = true; attempt = record;
    try { localStorage.removeItem(journalKey); } catch { /* Idempotent recovery checks the database on reload. */ }
    message('Saved locally. Export a backup to keep another copy.');
    el('result').textContent = record.outcome === 'interrupted' ? 'Interrupted attempt saved; excluded from averages and personal best.' : `${formatTime(effective(record))}${record.penaltyMs ? ` (includes +${record.penaltyMs / 1000}s)` : ''} — saved locally.`;
    await refresh().catch(error => message(`Your result is saved, but history could not be refreshed. ${errorText(error)}`, true));
    channel?.postMessage('saved');
  } catch (error) {
    message(`Save failed. Your result is kept for retry. ${errorText(error)}`, true);
    el('result').textContent = 'Do not clear browser data. Retry the save or export a backup.';
  } finally { saving = false; display(); }
}
function reset(): void {
  if (machine.active || saving || (machine.phase === 'review' && !saved)) return;
  machine = new PracticeTimer(() => performance.now(), inspection.checked);
  attempt = null; saved = false; lastPhase = ''; el('result').textContent = ''; display(); pad.focus();
}
function interrupt(): void {
  if (!machine.active) return;
  machine.cancel();
  try { if (machine.phase === 'review') journal(); else localStorage.removeItem(journalKey); } catch { /* Initial recovery record is already durable. */ }
  if (machine.phase === 'review') void saveResult(); else { attempt = null; el('result').textContent = 'Inspection cancelled.'; }
  pointerId = null; display();
}
async function refresh(): Promise<void> {
  snapshot = await repo.snapshot();
  if (!snapshot.sessions.some(s => s.id === selected)) selected = 'physical-default-3';
  picker.replaceChildren(...snapshot.sessions.map(s => {
    const option = document.createElement('option'); option.value = s.id; option.textContent = `${s.title} · ${s.puzzle}×${s.puzzle}${s.mode === 'simulator' ? ' · archive' : ''}`; return option;
  })); picker.value = selected;
  el('puzzle-label').textContent = `${session()?.puzzle}×${session()?.puzzle}`;
  const rows = ordered(snapshot.solves.filter(s => s.sessionId === selected));
  const stats = statistics(rows);
  el('stat-count').textContent = String(stats.count);
  for (const key of ['best','mean','ao5','ao12','ao100'] as const) el(`stat-${key}`).textContent = formatTime(stats[key]);
  const visible = rows.filter(s => !s.deleted).reverse();
  el('empty-history').hidden = visible.length > 0; el('history-table').hidden = visible.length === 0;
  el('more-history').hidden = visible.length <= limit;
  el('history').replaceChildren(...visible.slice(0, limit).map((solve, index) => {
    const tr = document.createElement('tr');
    const values = [String(visible.length - index), solve.outcome === 'interrupted' ? 'Interrupted' : formatTime(effective(solve)), solve.performedAt ? new Date(solve.performedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Date unknown'];
    for (const value of values) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
    if (solve.penaltyMs) { const small = document.createElement('small'); small.textContent = `Includes +${solve.penaltyMs / 1000}s`; tr.children[1]?.append(small); }
    const td = document.createElement('td'); const button = document.createElement('button'); button.textContent = 'Review'; button.className = 'secondary'; button.setAttribute('aria-label', `Review attempt ${visible.length - index}`); button.onclick = () => openEdit(solve); td.append(button); tr.append(td); return tr;
  }));
  const legacy = snapshot.legacySummaries[selected] ?? snapshot.legacySummaries[session()?.puzzle ?? ''];
  el('legacy-summary').textContent = session()?.mode === 'simulator' ? `Original simulator archive. Dates, scramble and penalty details were not recorded. Lifetime summary: ${JSON.stringify(legacy ?? {})}. This is a one-time import; future simulator solves remain in Play.` : '';
  if (attempt && saved) {
    const updated = snapshot.solves.find(row => row.id === attempt!.id);
    if (updated) {
      attempt = updated;
      machine.result = { elapsedMs: updated.elapsedMs, penaltyMs: updated.penaltyMs, outcome: updated.outcome };
      el('result').textContent = updated.deleted ? 'Result removed from statistics.' : updated.outcome === 'interrupted' ? 'Interrupted attempt saved; excluded from averages and personal best.' : `${formatTime(effective(updated))}${updated.penaltyMs ? ` (includes +${updated.penaltyMs / 1000}s)` : ''} — saved locally.`;
    }
  }
  display();
}
async function initialize(): Promise<void> {
  if (opening) return; opening = true; ready = false; el('retry-open').hidden = true; controls();
  try {
    await ownJournal();
    // Prove recovery storage works without touching any simulator keys.
    localStorage.setItem(`${journalKey}:check`, '1'); localStorage.removeItem(`${journalKey}:check`);
    deviceId = await repo.initialize();
    const raw = Object.fromEntries(LEGACY_KEYS.map(key => [key, localStorage.getItem(key)]));
    const migration = await repo.migrate(await prepareLegacy(raw));
    snapshot = await repo.snapshot();
    inspection.checked = snapshot.settings.inspection === true;
    selected = typeof snapshot.settings.selected === 'string' ? snapshot.settings.selected : selected;
    machine = new PracticeTimer(() => performance.now(), inspection.checked);
    const recovered = await recoverJournals();
    ready = true; await refresh(); display();
    message(`Local history ready.${recovered ? ` Recovered ${recovered} pending attempts; unfinished attempts are excluded from statistics.` : ''}${migration.count ? ` Preserved ${migration.count} simulator results.` : ''}${migration.quarantined ? ` ${migration.quarantined} invalid legacy records quarantined; originals retained.` : ''}`);
  } catch (error) { ready = false; message(`Could not open history. ${errorText(error)} Existing data has not been removed.`, true); el('retry-open').hidden = false; }
  finally { opening = false; controls(); }
}
pad.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing) return;
  event.preventDefault(); if (!event.repeat) advance(() => machine.press('space'), 'keyboard');
});
pad.addEventListener('keyup', event => { if (event.code === 'Space') { event.preventDefault(); advance(() => machine.release('space'), 'keyboard'); } });
pad.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary || pointerId !== null) return;
  event.preventDefault(); pad.focus(); pointerId = event.pointerId; pad.setPointerCapture(event.pointerId);
  advance(() => machine.press(`pointer:${event.pointerId}`), 'pointer');
});
pad.addEventListener('pointerup', event => {
  if (event.pointerId !== pointerId) return;
  event.preventDefault(); pointerId = null; advance(() => machine.release(`pointer:${event.pointerId}`), 'pointer');
});
pad.addEventListener('pointercancel', interrupt);
pad.addEventListener('lostpointercapture', () => { if (pointerId !== null) interrupt(); });
pad.addEventListener('click', event => { if (event.detail === 0) advance(() => machine.activate(), 'accessible'); });
pad.addEventListener('blur', () => { if (machine.phase === 'holding' || machine.phase === 'inspectionPress') interrupt(); });
el('simple-control').addEventListener('click', () => advance(() => machine.activate(), 'accessible'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && machine.active) { event.preventDefault(); interrupt(); }
});
window.addEventListener('blur', interrupt);
document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
window.addEventListener('pagehide', () => { interrupt(); releaseJournal?.(); releaseJournal = null; });
window.addEventListener('pageshow', event => {
  if (event.persisted) { journalKey = ''; void ownJournal().catch(report); }
});
window.addEventListener('beforeunload', event => { if (machine.phase === 'review' && !saved) { event.preventDefault(); event.returnValue = ''; } });
el('next').onclick = reset;
el('retry-save').onclick = () => void saveResult();
el('retry-open').onclick = () => void initialize();
picker.onchange = () => { if (locked()) return; selected = picker.value; limit = 50; reset(); void preferences(); void refresh().catch(report); };
inspection.onchange = () => { if (locked()) return; reset(); void preferences(); };
async function preferences(): Promise<void> {
  try { await repo.settings({ ...snapshot.settings, selected, inspection: inspection.checked }); }
  catch (error) { message(`Preference could not be saved: ${errorText(error)}`, true); }
}
function report(error: unknown): void { message(errorText(error), true); }
el('refresh').onclick = () => { if (!locked()) void refresh().catch(report); };
el('more-history').onclick = () => { limit += 50; void refresh().catch(report); };
channel?.addEventListener('message', () => { if (!locked()) void refresh().catch(report); });
const sessionDialog = el<HTMLDialogElement>('session-dialog');
el('new-session').onclick = () => { if (locked()) return; el('session-error').textContent = ''; sessionDialog.showModal(); };
el('cancel-session').onclick = () => sessionDialog.close();
el<HTMLFormElement>('session-form').onsubmit = event => {
  event.preventDefault(); void (async () => {
    const title = el<HTMLInputElement>('session-name').value.trim(); if (!title) return;
    try {
      const newSession: Session = { id: crypto.randomUUID(), title, puzzle: el<HTMLSelectElement>('session-puzzle').value as Session['puzzle'], mode: 'physical', createdAt: new Date().toISOString() };
      await repo.createSession(newSession); selected = newSession.id; limit = 50; await refresh(); await preferences(); sessionDialog.close(); reset(); channel?.postMessage('session');
    } catch (error) { el('session-error').textContent = errorText(error); }
  })();
};
const editDialog = el<HTMLDialogElement>('edit-dialog');
function openEdit(solve: Solve): void {
  if (locked()) return; editing = solve;
  el('edit-original').textContent = `Raw time: ${formatTime(solve.elapsedMs)}. Source: ${solve.source}. ${solve.revisions.length} previous adjustments.`;
  el('edit-scramble').textContent = `Scramble: ${solve.scramble ?? 'Not recorded'}`;
  el<HTMLSelectElement>('edit-outcome').value = solve.outcome;
  el<HTMLInputElement>('edit-penalties').value = String(solve.penaltyMs / 2000);
  el<HTMLInputElement>('edit-reason').value = '';
  for (const id of ['edit-outcome','edit-penalties','save-edit']) (el(id) as HTMLInputElement).disabled = solve.outcome === 'interrupted' || solve.source === 'legacy';
  el('edit-error').textContent = ''; editDialog.showModal();
}
el('cancel-edit').onclick = () => editDialog.close();
async function edit(remove: boolean): Promise<void> {
  if (!editing) return;
  const reason = el<HTMLInputElement>('edit-reason').value.trim();
  if (!reason) { el('edit-error').textContent = 'Enter a reason so the change can be reviewed later.'; el('edit-reason').focus(); return; }
  try {
    await repo.editSolve(editing.id, editing, { outcome: remove ? editing.outcome : el<HTMLSelectElement>('edit-outcome').value as Solve['outcome'], penaltyMs: remove ? editing.penaltyMs : Number(el<HTMLInputElement>('edit-penalties').value) * 2000, deleted: remove }, reason);
    editDialog.close(); await refresh(); channel?.postMessage('edit');
    message(remove ? 'Result removed from statistics. Its original record and change history remain in your backup.' : 'Adjustment saved; averages and personal best recalculated.');
  } catch (error) { el('edit-error').textContent = errorText(error); }
}
el<HTMLFormElement>('edit-form').onsubmit = event => { event.preventDefault(); void edit(false); };
el('delete-solve').onclick = () => void edit(true);
function download(value: unknown, name: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
el('export').onclick = () => void (async () => {
  try {
    let current = snapshot;
    try { current = await repo.snapshot(); } catch { dataMessage('History could not be refreshed. Exporting the last loaded history and pending result.', true); }
    if (attempt && !saved && machine.result && !current.solves.some(s => s.id === attempt!.id)) current = { ...current, solves: [...current.solves, { ...attempt, ...machine.result }] };
    download(await makeBackup(current), `the-cube-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dataMessage(`Exported ${current.sessions.length} sessions and ${current.solves.length} records${attempt && !saved ? ', including the pending attempt' : ''}.`);
  } catch (error) { dataMessage(errorText(error), true); }
})();
el('legacy-export').onclick = () => void repo.migrationBackup().then(rows => { download({ format: 'the-cube-legacy-originals', backups: rows }, 'the-cube-original-simulator-data.json'); dataMessage('Original simulator data exported separately for recovery.'); }).catch(error => dataMessage(errorText(error), true));
el<HTMLInputElement>('import-file').onchange = event => void (async () => {
  if (locked()) return;
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  importing = true; controls(); preview = null; el('import-preview').hidden = true;
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup exceeds 10 MiB');
    const parsed = await parseBackup(await file.text());
    const current = await repo.snapshot(); let conflicts = 0, existing = 0;
    for (const [incoming, stored] of [[parsed.sessions, current.sessions], [parsed.solves, current.solves]] as const) {
      const byId = new Map<string, unknown>(stored.map(row => [row.id, row]));
      for (const row of incoming) { const found = byId.get(row.id); if (found !== undefined) { existing++; if (canonical(found) !== canonical(row)) conflicts++; } }
    }
    preview = parsed; el('import-preview').hidden = false;
    el('import-summary').textContent = `${parsed.sessions.length} sessions, ${parsed.solves.length} records. ${existing} already present; ${conflicts} conflicts. Identical records are skipped; conflicts prevent the whole import. Current preferences are kept.`;
    el<HTMLButtonElement>('confirm-import').disabled = conflicts > 0;
    dataMessage('Backup validated. Review the counts before importing.');
  } catch (error) { dataMessage(`No data imported. ${errorText(error)}`, true); }
  finally { importing = false; input.value = ''; controls(); }
})();
el('cancel-import').onclick = () => { preview = null; el('import-preview').hidden = true; };
el('confirm-import').onclick = () => void (async () => {
  if (!preview || locked()) return;
  importing = true; controls(); el<HTMLButtonElement>('confirm-import').disabled = true;
  try { const result = await repo.importBackup(preview); await refresh(); dataMessage(`Import complete: ${result.added} new records, ${result.skipped} identical records skipped.`); preview = null; el('import-preview').hidden = true; channel?.postMessage('import'); }
  catch (error) { dataMessage(errorText(error), true); }
  finally { importing = false; controls(); el<HTMLButtonElement>('confirm-import').disabled = false; }
})();
el('persistent').onclick = () => void (async () => {
  try { const granted = await navigator.storage?.persist?.(); dataMessage(granted ? 'Storage protection granted. Keep exporting backups as well.' : 'Storage protection was not granted by this browser. Keep regular backups.'); }
  catch (error) { dataMessage(errorText(error), true); }
})();
function connection(): void { el('connection').textContent = !navigator.onLine ? 'Offline · local practice available' : navigator.serviceWorker?.controller ? 'Available offline' : 'Online · preparing offline files'; }
window.addEventListener('online', connection); window.addEventListener('offline', connection);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', connection);
  void navigator.serviceWorker.register('service-worker.js', { scope: '.' }).then(connection).catch(() => { el('connection').textContent = 'Offline files unavailable in this browser'; });
}
connection(); void initialize();
