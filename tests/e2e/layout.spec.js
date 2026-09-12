import { test, expect } from "@playwright/test";

test("app menu fits phones, tablets and desktop with accessible tools and optional help", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html");
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [820, 1180],
    [1024, 768],
    [1440, 900],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".menu-grid")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const link of await page.locator(".menu-grid a").all()) {
      const box = await link.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator(".menu-help")).not.toHaveAttribute("open", "");
    await expect(page.locator(".menu-help p").first()).toBeHidden();
    await expect(page.locator(".sculpture-cube")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.screenshot({
      path: `test-results/app-menu-${width}.png`,
      fullPage: true,
    });
  }
  await page.locator(".menu-help summary").click();
  await expect(page.locator(".menu-help p").first()).toBeVisible();
  await page.getByRole("link", { name: "Close menu", exact: true }).click();
  await page.waitForFunction(
    () => window.game && game.transition.activeTransitions === 0,
  );
  await expect(
    page.getByRole("button", { name: "Statistics", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preferences", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".keyboard-help")).toBeHidden();
});

test("original trophy keeps real averages and original preferences remain on the homepage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/the-cube/");
  await page.waitForFunction(
    () => window.game && game.transition.activeTransitions === 0,
  );
  // Synthetic original-format scores verify the visible trophy reads saved history.
  await page.evaluate(() =>
    [10000, 20000, 30000, 40000, 50000].forEach((time) =>
      game.scores.addScore(time),
    ),
  );
  await page.reload();
  await page.waitForFunction(
    () => window.game && game.transition.activeTransitions === 0,
  );
  await page.getByRole("button", { name: "Statistics", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 3 && game.transition.activeTransitions === 0,
  );
  await expect(page.locator('.stats[name="total-solves"] b')).toHaveText("5");
  await expect(page.locator('.stats[name="best-time"] b')).toHaveText("0:10");
  await expect(page.locator('.stats[name="average-5"] b')).toHaveText("0:30");
  await page.screenshot({
    path: "test-results/original-trophy.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 0 && game.transition.activeTransitions === 0,
  );
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 4 && game.transition.activeTransitions === 0,
  );
  for (const name of ["size", "flip", "scramble", "fov", "theme"])
    await expect(page.locator(`.range[name="${name}"]`)).toBeVisible();
  await expect(page.locator(".keyboard-help")).toBeHidden();
});
