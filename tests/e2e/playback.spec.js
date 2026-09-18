import { test, expect } from "./origin-fixture.js";
import AxeBuilder from "@axe-core/playwright";
import { compilePlayback, solved, sequenceTokens } from "../../packages/cube-core/dist/index.js";

async function open(page, reduced = true) {
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.goto("/the-cube/menu.html#/explore");
  await expect(page.getByRole("heading", { name: "See what each move does." })).toBeVisible();
}
async function load(page, sequence) {
  await page.getByRole("textbox", { name: "Move sequence to explore", exact: true }).fill(sequence);
  await page.getByRole("button", { name: "Load sequence", exact: true }).click();
}
async function seek(page, step) {
  const slider = page.getByRole("slider", { name: "Move timeline" });
  await slider.press("Home");
  for (let i = 0; i < step; i++) await slider.press("ArrowRight");
  await expect(page.getByTestId("playback-step")).toHaveText(String(step));
}
const facelets = async page => (await page.locator(".playback-net .sticker").allTextContents()).join("");

for (const size of [2, 3, 4, 5]) test(`${size}x${size}: playback, reverse, seek, explanations and net agree`, async ({ page }) => {
  await open(page);
  await page.getByRole("combobox", { name: "Puzzle", exact: true }).selectOption(String(size));
  const sequence = size === 2 ? "R U R' U' x x'" : size === 4 ? "Rw 2R U 2R' Rw' x'" : "Rw M E' S2 x y'";
  await load(page, sequence);
  const expected = compilePlayback(solved(size), sequenceTokens(sequence, size)).states;
  await expect(page.locator(".cube-view canvas")).toBeVisible();
  await page.getByText("View all six faces · text alternative", { exact: true }).click();
  await expect(page.locator(".playback-net .sticker")).toHaveCount(size * size * 6);
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  expect(await facelets(page)).toBe(expected[1].facelets);
  await expect(page.getByTestId("step-explanation")).toContainText("Completed 1 move.");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  expect(await facelets(page)).toBe(expected[0].facelets);
  for (const step of [4, 2, 6, 0]) {
    await seek(page, step);
    expect(await facelets(page)).toBe(expected[step].facelets);
  }
  await page.getByText("Move sequence", { exact: true }).click();
  await page.getByRole("button", { name: /^Go to move 3:/ }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("2");
  expect(await facelets(page)).toBe(expected[2].facelets);
  await page.getByRole("combobox", { name: "Playback speed", exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Play sequence", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("6");
  expect(await facelets(page)).toBe(expected[6].facelets);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  expect(await facelets(page)).toBe(expected[0].facelets);
});

test("seeking and demo playback preserve earned lesson credit and reload position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html#/learn");
  await seek(page, 2);
  await expect(page.locator(".lesson-progress")).toContainText("0 / 2 moves practiced");
  await page.reload();
  await expect(page.getByTestId("playback-step")).toHaveText("2");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Play demonstration", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("2");
  await expect(page.locator(".lesson-progress")).toContainText("0 / 2 moves practiced");
  await seek(page, 0);
  await page.getByRole("button", { name: "Apply my move", exact: true }).click();
  await expect(page.locator(".lesson-progress")).toContainText("1 / 2 moves practiced");
});

test("pause, rapid seeking, loop, reduced-motion changes and unmount cancel stale animation", async ({ page }) => {
  await open(page, false);
  await page.clock.install();
  await page.clock.pauseAt(Date.now());
  await load(page, "R U R' U'");
  await page.getByRole("combobox", { name: "Playback speed", exact: true }).selectOption("0.5");
  await page.getByRole("button", { name: "Play sequence", exact: true }).click();
  await page.clock.runFor(1400);
  await expect(page.locator(".exercise-feedback")).toHaveText("Turning…");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await page.clock.runFor(100);
  await seek(page, 3);
  await seek(page, 1);
  await page.clock.runFor(1000);
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".sequence-player")).toHaveAttribute("data-motion", "reduce");
  await expect(page.getByLabel("Reduce motion", { exact: true })).toBeDisabled();
  await load(page, "R");
  await page.getByLabel("Loop sequence").check();
  await page.getByRole("button", { name: "Play sequence", exact: true }).click();
  await page.clock.runFor(700);
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  // React's passive effect may schedule the next timer after the state commit.
  // Advance in small steps until rewind, rather than assume an engine's task timing.
  await expect.poll(async () => {
    await page.clock.runFor(100);
    return page.getByTestId("playback-step").textContent();
  }, { intervals: [50] }).toBe("0");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Play sequence", exact: true })).toBeVisible();
  const hiddenAt = await page.getByTestId("playback-step").textContent();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("playback-step")).toHaveText(hiddenAt);
  await page.evaluate(() => { delete document.hidden; });
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.locator(".sequence-player canvas")).toHaveCount(0);
  await page.goto("/the-cube/menu.html#/explore");
  await expect(page.getByTestId("playback-step")).toHaveText("0");
});

test("5x5 reuses textures while seeking and releases them on route exit", async ({ page }) => {
  await page.addInitScript(() => {
    window.textureCounts = { created: 0, deleted: 0, lost: 0 };
    const getContext = HTMLCanvasElement.prototype.getContext;
    const tracked = new WeakSet();
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (context && type.includes("webgl") && !tracked.has(this)) {
        tracked.add(this);
        this.addEventListener("webglcontextlost", () => { window.textureCounts.lost++; });
      }
      return context;
    };
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      for (const [method, count] of [["createTexture", "created"], ["deleteTexture", "deleted"]]) {
        const original = proto[method];
        proto[method] = function (...args) { window.textureCounts[count]++; return original.apply(this, args); };
      }
    }
  });
  await open(page);
  await page.getByRole("combobox", { name: "Puzzle", exact: true }).selectOption("5");
  const created = await page.evaluate(() => window.textureCounts.created);
  for (const step of [8, 0, 4, 2, 7, 0]) await seek(page, step);
  expect(await page.evaluate(() => window.textureCounts.created)).toBe(created);
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  // Six owned label textures per player; Three's internal fallback textures
  // are released with the context rather than through material disposal.
  await expect.poll(() => page.evaluate(() => window.textureCounts.deleted)).toBe(12);
  await expect.poll(() => page.evaluate(() => window.textureCounts.lost)).toBe(2);
});

test("5x5 text playback works without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await open(page);
  await page.getByRole("combobox", { name: "Puzzle", exact: true }).selectOption("5");
  await expect(page.getByText("3D is unavailable in this browser.", { exact: false })).toBeVisible();
  await seek(page, 5);
  await page.getByText("View all six faces · text alternative", { exact: true }).click();
  await expect(page.locator(".playback-net .sticker")).toHaveCount(150);
  await expect(page.getByTestId("next-move")).toHaveText("M'");
});

test("invalid input, empty sequences, accessible layouts and offline keep data intact", async ({ page, stopOrigin }) => {
  await open(page);
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole("combobox", { name: "Puzzle", exact: true }).selectOption("4");
  await load(page, "M");
  await expect(page.getByRole("alert")).toContainText("needs a single middle layer");
  await expect(page.getByTestId("next-move")).toHaveText("Rw");
  await load(page, "");
  await expect(page.getByRole("button", { name: "Play sequence", exact: true })).toBeDisabled();
  await load(page, "2R U 2R'");
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations).toEqual([]);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await stopOrigin();
  await page.reload();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});
