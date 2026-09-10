import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/the-cube/');
  await page.waitForFunction(() => window.game && game.transition.activeTransitions === 0);
}
async function start(page) {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => game.state === 1 && game.controls.enabled && game.controls.scramble === null && game.transition.activeTransitions === 0);
  await expect(page.locator('.text--title i').first()).toHaveCSS('opacity', '0');
}
// Euler angles are not unique: +PI and -PI describe the same orientation.
// Compare the actual local transforms so equivalent rotations remain equal.
const cubeState = page => page.evaluate(() => JSON.stringify(game.cube.pieces.map(piece => {
  piece.updateMatrix();
  return [piece.name, ...piece.matrix.elements.map(value => Math.round(value * 10000))];
})));

test('keyboard turns change the cube, inverse restores it, timer starts and game resumes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await start(page);
  const before = await cubeState(page);
  await page.keyboard.press('j');
  await page.waitForFunction(() => game.controls.state === 0 && !game.newGame);
  expect(await cubeState(page)).not.toBe(before);
  await expect.poll(() => page.locator('.text--timer').innerText()).not.toBe('0:00');
  await page.keyboard.press('f');
  await page.waitForFunction(() => game.controls.state === 0);
  expect(await cubeState(page)).toBe(before);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => game.state === 0 && game.transition.activeTransitions === 0);
  await page.reload();
  await page.waitForFunction(() => window.game && game.transition.activeTransitions === 0);
  await start(page);
  expect(await cubeState(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('offline reload works at the project subpath and keeps unrelated caches', async ({ page, context }) => {
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await caches.open('unrelated-app');
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.game && game.transition.activeTransitions === 0);
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => caches.has('unrelated-app'))).toBe(true);
  await start(page);
  await page.keyboard.press('i');
  await page.waitForFunction(() => !game.newGame);
});

test('mobile layout and labeled controls remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await expect(page.getByRole('button', { name: 'Preferences', exact: true })).toBeEnabled();
  await page.getByText('Keyboard controls', { exact: true }).click();
  await expect(page.getByText('J / F', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByText('Keyboard controls', { exact: true }).click();
  await page.locator('.ui__game').dblclick({ position: { x: 190, y: 400 } });
  await page.waitForFunction(() => game.state === 1 && game.controls.enabled);
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeEnabled();
});
