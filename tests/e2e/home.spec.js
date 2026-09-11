import { test, expect } from "@playwright/test";

test("touch homepage turns, opens menu safely, and resumes the same cube", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/the-cube/");
  await page.waitForFunction(
    () => window.game && game.transition.activeTransitions === 0,
  );
  await expect(page.locator(".cube-home canvas")).toBeVisible();
  await expect(page.locator(".keyboard-help")).toBeHidden();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      game.state === 1 &&
      game.controls.enabled &&
      game.controls.scramble === null &&
      game.transition.activeTransitions === 0,
  );
  const before = await page.evaluate(() =>
    localStorage.getItem("theCube_savedState"),
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 422 }],
  });
  for (const x of [210, 230, 255])
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: 422 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForFunction(() => game.controls.state === 0 && !game.newGame);
  const saved = await page.evaluate(() =>
    localStorage.getItem("theCube_savedState"),
  );
  expect(saved).not.toBe(before);
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page).toHaveURL(/menu\.html$/);
  await expect(page.locator(".menu-grid")).toBeVisible();
  for (const name of [
    "Play",
    "Practice",
    "Timer",
    "Settings",
    "License",
    "About the developer",
  ])
    await expect(
      page.locator(".menu-grid").getByRole("link", { name, exact: true }),
    ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/menu-mobile.png",
    fullPage: true,
  });
  await page
    .locator(".menu-grid")
    .getByRole("link", { name: "Play", exact: true })
    .click();
  await page.waitForFunction(
    () => window.game && game.transition.activeTransitions === 0,
  );
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe(saved);
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      game.state === 1 &&
      game.controls.enabled &&
      game.transition.activeTransitions === 0,
  );
  expect(await page.evaluate(() => game.saved)).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
});

test("menu information, original settings and old settings bookmarks remain reachable", async ({
  page,
}) => {
  await page.goto("/the-cube/#/settings");
  await expect(page).toHaveURL(/menu\.html#\/settings$/);
  await page
    .getByRole("link", { name: "Open touch-cube settings", exact: false })
    .click();
  await page.waitForFunction(
    () =>
      window.game &&
      game.state === 4 &&
      game.transition.activeTransitions === 0,
  );
  await expect(page.locator(".ui__prefs")).toBeVisible();
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await page
    .locator(".menu-grid")
    .getByRole("link", { name: "About the developer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Rahul Singh Parmar", exact: true }),
  ).toBeVisible();
  await expect(page.locator("article")).toContainText("Boris Sehovac");
  await page.getByRole("link", { name: "← Menu", exact: true }).click();
  await page
    .locator(".menu-grid")
    .getByRole("link", { name: "License", exact: true })
    .click();
  await expect(page.locator("article")).toContainText("ISC");
  await page.getByRole("link", { name: "← Menu", exact: true }).click();
  await page
    .getByRole("link", { name: "Cube statistics", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      window.game &&
      game.state === 3 &&
      game.transition.activeTransitions === 0,
  );
});
