import { test, expect } from "./origin-fixture.js";

const routes = ["algorithms", "training", "guides", "statistics"];

test("sections fit touch layouts and link to every existing tool with keyboard navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html");
  for (const title of [
    "Algorithms",
    "Training",
    "Guides",
    "Solve",
    "Practice",
    "Timer",
    "Statistics",
    "Settings",
  ])
    await expect(
      page
        .locator(".menu-grid")
        .getByRole("link", { name: title, exact: true }),
    ).toBeVisible();
  await expect(page.locator(".menu-help")).not.toHaveAttribute("open", "");
  for (const route of routes) {
    await page.goto(`/the-cube/menu.html#/${route}`);
    await expect(page.locator("h1")).toBeFocused();
    for (const [width, height] of [
      [320, 740],
      [820, 1180],
      [1440, 900],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const card of await page.locator(".section-card").all()) {
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 740 });
  const switcher = page.locator(".section-switcher summary");
  await switcher.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "All sections" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(switcher).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "All sections" }),
  ).toBeHidden();
  await switcher.click();
  await page
    .getByRole("navigation", { name: "All sections" })
    .getByRole("link", { name: "Algorithms", exact: true })
    .click();
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator(".section-switcher")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.getByRole("link", { name: "PLL", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find your next pattern." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "← Training", exact: true }).click();
  await expect(page).toHaveURL(/#\/training$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/train$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/algorithms$/);
  await page.goto("/the-cube/menu.html#/learn");
  await page.getByRole("link", { name: "← Guides", exact: true }).click();
  await expect(page).toHaveURL(/#\/guides$/);
});

test("new navigation keeps cube checkpoints, learning records and timer history across reload and offline", async ({
  page,
  stopOrigin,
}) => {
  await page.goto("/the-cube/menu.html#/play");
  await expect(page.locator(".cube-view canvas")).toBeVisible();
  await page.getByRole("button", { name: "R clockwise", exact: true }).click();
  await expect(page.getByTestId("move-count")).toHaveText("1");
  // Seed an opaque recovery record. Landing pages must not parse or rewrite it.
  await page.evaluate(() => {
    localStorage.setItem(
      "the-cube-f2l-v1:/the-cube/",
      '{"recovery":"keep exact bytes"}',
    );
    localStorage.setItem("theCube_savedState", '{"legacy":"unchanged"}');
  });
  const keys = [
    "the-cube-v2:/the-cube/",
    "the-cube-f2l-v1:/the-cube/",
    "theCube_savedState",
  ];
  const before = await page.evaluate(
    (keys) => keys.map((key) => localStorage.getItem(key)),
    keys,
  );
  await page.goto("/the-cube/timer.html");
  await page
    .getByRole("button", { name: "Start without holding", exact: true })
    .click();
  await page.getByRole("button", { name: "Stop timer", exact: true }).click();
  await expect(page.locator("#stat-count")).toHaveText("1");
  await page.getByRole("link", { name: "Statistics", exact: true }).click();
  await page
    .getByRole("link", { name: "Physical-cube statistics", exact: true })
    .click();
  await expect(page).toHaveURL(/timer\.html#stats-title$/);
  await expect(page.locator("#stats-title")).toBeInViewport();
  await expect(page.locator("#stat-count")).toHaveText("1");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await stopOrigin();
  for (const route of routes) {
    await page.goto(`/the-cube/menu.html#/${route}`);
    await page.reload();
    await expect(page.locator(".section-cards")).toBeVisible();
  }
  expect(
    await page.evaluate(
      (keys) => keys.map((key) => localStorage.getItem(key)),
      keys,
    ),
  ).toEqual(before);
  await page
    .getByRole("link", { name: "Physical-cube statistics", exact: true })
    .click();
  await expect(page.locator("#stat-count")).toHaveText("1");
});

test("original settings return to their app section while standalone panel URLs retain cube back behavior", async ({
  page,
}) => {
  await page.goto("/the-cube/menu.html#/settings");
  await page
    .getByRole("link", { name: "Open touch-cube settings", exact: false })
    .click();
  await expect(
    page.getByRole("region", { name: "Cube settings", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => Boolean(game.transition.tweens.cube))).toBe(
    false,
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/menu\.html#\/settings$/);
  await page.goto("/the-cube/?panel=stats");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/the-cube\/$/);
  await expect(
    page.getByRole("button", { name: "Preferences", exact: true }),
  ).toBeVisible();
});
