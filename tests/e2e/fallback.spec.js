import { test, expect } from '@playwright/test';

test('unavailable graphics preserves recovery warnings and the text cube remains usable', async ({page}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
      if (kind.includes('webgl')) return null;
      return original.call(this, kind, ...args);
    };
    if (!localStorage.getItem('the-cube-v2:/the-cube/')) localStorage.setItem('the-cube-v2:/the-cube/', '{"broken":true}');
  });
  await page.goto('/the-cube/');
  await expect(page.getByRole('alert')).toContainText('not been overwritten');
  await expect(page.getByText('3D view unavailable.', {exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'R clockwise',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Start a new cube',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'R clockwise',exact:true}).click();
  await expect(page.getByTestId('move-count')).toHaveText('1');
  await page.getByText('Cube state · URFDLB', {exact:true}).click();
  await expect(page.getByLabel('U row 1 column 3: F', {exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('move-count')).toHaveText('1');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
