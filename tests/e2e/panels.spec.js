import { test, expect } from "./origin-fixture.js";

test("original panels open directly from the app and preserve saved cubes offline", async ({
  page,
  stopOrigin,
}) => {
  await page.goto("/the-cube/menu.html#/settings");
  await page
    .getByRole("link", { name: "Open touch-cube settings", exact: false })
    .click();
  await expect(
    page.getByRole("region", { name: "Cube settings", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      state: game.state,
      entering: Boolean(game.transition.tweens.cube),
      rendering: game.world.rendering,
    })),
  ).toEqual({ state: 4, entering: false, rendering: false });
  await expect(
    page.locator(".cube-panel-heading, .cube-panel-nav, .panel-cube"),
  ).toHaveCount(0);
  await page.evaluate(() => game.storage.saveGame());
  const saved = await page.evaluate(() =>
    localStorage.getItem("theCube_savedState"),
  );
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await page
    .getByRole("link", { name: "Cube statistics", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Cube statistics", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => Boolean(game.transition.tweens.cube))).toBe(
    false,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.reload();
  await expect(page.locator('.stats[name="cube-size"] b')).toHaveText("3x3x3");
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe(saved);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForFunction(() => game.transition.activeTransitions === 0);
  expect(await page.evaluate(() => game.world.rendering)).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe(saved);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => game.state === 1 && game.controls.enabled);
});

test("original sliders retain keyboard choices and color-editor round trips", async ({
  page,
}) => {
  await page.goto("/the-cube/?panel=settings");
  const slider = page.getByRole("slider", { name: "Flip Type", exact: true });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "Smooth");
  await page.reload();
  await expect(slider).toHaveAttribute("aria-valuetext", "Smooth");
  await page.getByRole("button", { name: "Bounce", exact: true }).click();
  await expect(slider).toHaveAttribute("aria-valuetext", "Bounce");
  await page.getByRole("button", { name: "Edit theme", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 5 && game.transition.activeTransitions === 0,
  );
  await expect(page.locator(".ui__texts")).toBeHidden();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 4 && game.transition.activeTransitions === 0,
  );
  await expect(slider).toHaveAttribute("aria-valuetext", "Bounce");
  await expect(slider).toBeVisible();
});

test("original layout fits each viewport and full-density rendering is preserved", async ({
  page,
  browser,
  browserName,
}) => {
  for (const size of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/the-cube/?panel=settings");
    for (const label of [
      "Cube Size",
      "Flip Type",
      "Scramble Length",
      "Camera Angle",
      "Color Scheme",
    ])
      await expect(
        page.getByRole("slider", { name: label, exact: true }),
      ).toBeInViewport();
    expect(
      await page
        .locator('.range[name="size"]')
        .evaluate((el) => ({
          background: getComputedStyle(el).backgroundColor,
          radius: getComputedStyle(el).borderRadius,
        })),
    ).toEqual({ background: "rgba(0, 0, 0, 0)", radius: "0px" });
    await page.screenshot({
      path: `test-results/original-settings-${browserName}-${size.width}.png`,
    });
    await page.goto("/the-cube/?panel=stats");
    await expect(page.locator('.stats[name="average-25"]')).toBeInViewport();
    await page.screenshot({
      path: `test-results/original-stats-${browserName}-${size.width}.png`,
    });
  }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  const dense = await context.newPage();
  await dense.goto(page.url());
  expect(await dense.evaluate(() => game.world.renderer.getPixelRatio())).toBe(
    3,
  );
  expect(
    await dense
      .locator("canvas")
      .evaluate((el) => el.width / el.getBoundingClientRect().width),
  ).toBe(3);
  await context.close();
});
