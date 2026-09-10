import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function ready(page) {
  await page.goto('/the-cube/timer.html');
  await expect(page.getByRole('button', { name: 'Timer pad', exact: true })).toBeEnabled();
}
async function keyboardStart(page) {
  await page.getByRole('button', { name: 'Timer pad', exact: true }).focus();
  await page.keyboard.down('Space');
  await expect(page.locator('#phase')).toHaveText('Ready — release to start');
  await page.keyboard.up('Space');
  await expect(page.locator('#phase')).toHaveText('Solving');
}
async function stop(page) {
  await page.keyboard.press('Space');
  await expect(page.locator('#result')).toContainText('saved locally');
}
test('physical timer keyboard journey, result adjustment, sessions, reload and simulator entry', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page); await keyboardStart(page); await page.waitForTimeout(180); await stop(page);
  await expect(page.locator('#stat-count')).toHaveText('1');
  await page.screenshot({ path: 'test-results/practice-desktop.png', fullPage: true });
  await expect(page.locator('#stat-best')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Review attempt 1', exact: true }).click();
  await page.getByLabel('Total +2 penalties').fill('2');
  await page.getByLabel('Reason for adjustment').fill('Two practice penalties');
  await page.getByRole('button', { name: 'Save adjustment' }).click();
  await expect(page.locator('#history')).toContainText('Includes +4s');
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  await page.getByLabel('Session name', { exact: true }).fill('Evening 2×2');
  await page.getByLabel('Cube size', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Create session', exact: true }).click();
  await expect(page.locator('#stat-count')).toHaveText('0');
  await page.reload(); await expect(page.locator('#session')).toContainText('Evening 2×2');
  await expect(page.locator('#puzzle-label')).toHaveText('2×2');
  await page.locator('#session').selectOption('physical-default-3');
  await expect(page.locator('#stat-count')).toHaveText('1');
  await page.getByRole('link', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.game && game.transition.activeTransitions === 0);
  await expect(page.getByRole('link', { name: 'Physical cube timer' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('inspection start is separate; +2 boundary and timeout produce the correct records', async ({ page }) => {
  await ready(page); await page.clock.install();
  await page.getByLabel('15-second inspection').check();
  const pad = page.getByRole('button', { name: 'Timer pad', exact: true }); await pad.focus();
  await page.keyboard.press('Space'); await expect(page.locator('#phase')).toHaveText('Inspect your cube');
  await page.clock.runFor(15000);
  await page.keyboard.down('Space'); await page.clock.runFor(350); await page.keyboard.up('Space');
  await expect(page.locator('#phase')).toHaveText('Solving');
  await page.clock.runFor(1000); await stop(page);
  await expect(page.locator('#history')).toContainText('Includes +2s');
  await page.getByRole('button', { name: 'Next solve' }).click(); await page.keyboard.press('Space');
  await page.clock.runFor(17020);
  await expect(page.locator('#result')).toContainText('DNF — saved locally');
  await expect(page.locator('#stat-count')).toHaveText('2');
});
test('write failure retains the result, retry is safe, active reload becomes interrupted and offline reload retains history', async ({ page, context }) => {
  await ready(page);
  await page.evaluate(() => {
    window.originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value, ...args) { if (this.name === 'solves') throw new DOMException('Storage full', 'QuotaExceededError'); return window.originalAdd.call(this, value, ...args); };
  });
  await keyboardStart(page); await page.keyboard.press('Space');
  await expect(page.locator('#status')).toContainText('Save failed');
  await expect(page.getByRole('button', { name: 'Next solve' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export backup', exact: true })).toBeEnabled();
  await page.evaluate(() => { IDBObjectStore.prototype.add = window.originalAdd; });
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page.locator('#stat-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Next solve' }).click(); await keyboardStart(page);
  await page.reload();
  await expect(page.locator('#history')).toContainText('Interrupted');
  await expect(page.locator('#stat-count')).toHaveText('1');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true); await page.reload();
  await expect(page.getByRole('heading', { name: 'Practice timer', exact: true })).toBeVisible();
  await expect(page.locator('#stat-count')).toHaveText('1');
  await expect(page.locator('#connection')).toContainText('Offline');
});
test('backup exports all sessions, previews imports and rejects tampering without modifying records', async ({ page, browser }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Start without holding', exact: true }).click();
  await page.getByRole('button', { name: 'Stop timer', exact: true }).click();
  await expect(page.locator('#stat-count')).toHaveText('1');
  const downloadEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadEvent; const bytes = await readFile(await download.path());
  const data = JSON.parse(bytes); expect(data.solves).toHaveLength(1);
  const other = await browser.newContext(); const restored = await other.newPage(); await ready(restored);
  await restored.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: bytes });
  await expect(restored.locator('#import-summary')).toContainText('0 conflicts');
  await expect(restored.locator('#stat-count')).toHaveText('0');
  await restored.getByRole('button', { name: 'Import backup', exact: true }).click();
  await expect(restored.locator('#stat-count')).toHaveText('1');
  await restored.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: bytes });
  await restored.getByRole('button', { name: 'Import backup', exact: true }).click();
  await expect(restored.locator('#data-status')).toContainText('0 new records');
  data.solves[0].elapsedMs = 888;
  await restored.locator('#import-file').setInputFiles({ name: 'damaged.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(restored.locator('#data-status')).toContainText('checksum');
  await expect(restored.locator('#stat-count')).toHaveText('1'); await other.close();
});
test('legacy migration keeps source bytes and archives invalid data; mobile touch works at 320 pixels', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('fixture-added')) {
      localStorage.setItem('theCube_scores', '{"3":{"scores":[1000,-2,3000],"solves":900,"best":500,"worst":90000}}');
      localStorage.setItem('theCube_savedState', 'preserve me'); localStorage.setItem('fixture-added', 'true');
    }
  });
  await ready(page); await expect(page.locator('#status')).toContainText('1 invalid legacy');
  const original = await page.evaluate(() => localStorage.getItem('theCube_scores'));
  const cdp = await context.newCDPSession(page);
  const pad = page.getByRole('button', { name: 'Timer pad', exact: true }); await pad.scrollIntoViewIfNeeded(); const bounds = await pad.boundingBox();
  const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await expect(page.locator('#phase')).toHaveText('Ready — release to start');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#phase')).toHaveText('Solving'); await pad.tap();
  await expect(page.locator('#stat-count')).toHaveText('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/practice-mobile.png', fullPage: true });
  expect(await page.evaluate(() => localStorage.getItem('theCube_scores'))).toBe(original);
  expect(await page.evaluate(() => localStorage.getItem('theCube_savedState'))).toBe('preserve me');
  await page.locator('#session').selectOption({ label: (await page.locator('#session option').allTextContents()).find(t => t.includes('archive')) });
  await expect(page.locator('#stat-count')).toHaveText('2');
  await expect(page.locator('#legacy-summary')).toContainText('900');
  await expect(pad).toBeDisabled(); await context.close();
});

test('closed-tab pending results recover without taking ownership from a live tab', async ({ page, context }) => {
  await ready(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value, ...args) { if (this.name === 'solves') throw new DOMException('Storage full', 'QuotaExceededError'); return original.call(this, value, ...args); };
  });
  await keyboardStart(page); await page.keyboard.press('Space');
  await expect(page.locator('#status')).toContainText('Save failed');
  const other = await context.newPage(); await ready(other);
  await expect(other.locator('#stat-count')).toHaveText('0');
  await page.close(); await other.reload();
  await expect(other.locator('#stat-count')).toHaveText('1');
  await expect(other.locator('#status')).toContainText('Recovered 1');
  await other.reload(); await expect(other.locator('#stat-count')).toHaveText('1');
});

test('editing controls never start the timer, Escape interrupts, and deleted results recalculate statistics', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'New session', exact: true }).click();
  await page.getByLabel('Session name', { exact: true }).fill('Space');
  await page.keyboard.press('Space'); await expect(page.locator('#phase')).toHaveText('Ready when you are');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await keyboardStart(page); await page.keyboard.press('Escape');
  await expect(page.locator('#result')).toContainText('Interrupted'); await expect(page.locator('#stat-count')).toHaveText('0');
  await page.getByRole('button', { name: 'Next solve' }).click(); await keyboardStart(page); await stop(page);
  await page.getByRole('button', { name: 'Review attempt 2', exact: true }).click();
  await page.getByLabel('Outcome', { exact: true }).selectOption('dnf');
  await page.getByLabel('Reason for adjustment').fill('Not solved');
  await page.getByRole('button', { name: 'Save adjustment' }).click();
  await expect(page.locator('#stat-best')).toHaveText('—'); await expect(page.locator('#stat-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Review attempt 2', exact: true }).click();
  await page.getByLabel('Reason for adjustment').fill('Accidental attempt');
  await page.getByRole('button', { name: 'Delete result', exact: true }).click();
  await expect(page.locator('#stat-count')).toHaveText('0');
});
