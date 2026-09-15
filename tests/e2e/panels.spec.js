import { test, expect } from "./origin-fixture.js";
import AxeBuilder from "@axe-core/playwright";

test("panel links bypass cube entrance, preserve checkpoints and resume offline", async ({
  page,
  stopOrigin,
}) => {
  await page.goto("/the-cube/menu.html#/settings");
  await page
    .getByRole("link", { name: "Open touch-cube settings", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make it your cube.", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      state: game.state,
      entering: Boolean(game.transition.tweens.cube),
      active: game.transition.activeTransitions,
      rendering: game.world.rendering,
    })),
  ).toEqual({ state: 4, entering: false, active: 0, rendering: false });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.evaluate(() => game.storage.saveGame());
  const saved = await page.evaluate(() =>
    localStorage.getItem("theCube_savedState"),
  );
  await page
    .getByRole("navigation", { name: "Cube panels" })
    .getByRole("button", { name: "Statistics", exact: true })
    .click();
  await expect(page).toHaveURL(/\?panel=stats$/);
  await expect(
    page.getByRole("heading", { name: "Every solve counts." }),
  ).toBeFocused();
  await page.reload();
  expect(await page.evaluate(() => Boolean(game.transition.tweens.cube))).toBe(
    false,
  );
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe(saved);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Every solve counts." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Cube", exact: true }).click();
  await expect(page.locator(".ui__game")).toBeVisible();
  await page.waitForFunction(() => game.transition.activeTransitions === 0);
  expect(await page.evaluate(() => game.world.rendering)).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe(saved);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => game.state === 1 && game.controls.enabled);
});

test("settings support direct choices, keyboard adjustment and theme round trips", async ({
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
  await expect(
    page.getByRole("slider", { name: "Hue", exact: true }),
  ).toBeAttached();
  await expect(page.locator(".ui__texts")).toBeHidden();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForFunction(
    () => game.state === 4 && game.transition.activeTransitions === 0,
  );
  await expect(
    page.getByRole("heading", { name: "Make it your cube." }),
  ).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuetext", "Bounce");
  await page.getByRole("button", { name: "← Cube", exact: true }).click();
  await page.waitForFunction(() => game.transition.activeTransitions === 0);
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await expect(slider).toHaveAttribute("aria-valuetext", "Bounce");
});

test("panels fit phones and landscape, scroll by touch, and respect reduced motion", async ({
  page,
  context,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const size of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/the-cube/?panel=settings");
    await expect(
      page.getByRole("heading", { name: "Make it your cube." }),
    ).toBeVisible();
    expect(
      await page
        .locator(".ui__prefs")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page
        .locator(".ui__prefs")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    await page.getByRole("button", { name: "Rain", exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "Color Scheme", exact: true }),
    ).toHaveAttribute("aria-valuetext", "Rain");
    await page.screenshot({
      path: `test-results/panels-${browserName}-${size.width}.png`,
    });
  }
  if (browserName === "chromium") {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 250, y: 640 }],
    });
    for (const y of [580, 500, 420, 340, 260])
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 250, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.locator(".ui__prefs").evaluate((el) => el.scrollTop))
      .toBeGreaterThan(100);
  }
});
