import { test, expect } from "./origin-fixture.js";
import { readFile } from "node:fs/promises";
import {
  apply,
  parseMove,
  solved,
} from "../../packages/cube-core/dist/index.js";

const fixture = "R U R' U' F2"
  .split(" ")
  .reduce((state, token) => apply(state, parseMove(token, 3)), solved(3));
async function enter(page, facelets = fixture.facelets) {
  const section = page.getByText("Paste face letters (URFDLB)", {
    exact: true,
  });
  if (!(await page.getByLabel("54 face letters").isVisible()))
    await section.click();
  await page.getByLabel("54 face letters").fill(facelets);
  await page
    .getByRole("button", { name: "Load face letters", exact: true })
    .click();
}
async function ready(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/the-cube/menu.html#/solve");
  await expect(
    page.getByRole("heading", { name: "Solve your cube." }),
  ).toBeVisible();
}
test("manual input persists and the real worker produces independently verified reversible playback", async ({
  page,
  browserName,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole("button", { name: "Paint Red", exact: true }).click();
  await page
    .getByRole("button", { name: "U row 1 column 1: unfilled", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "U row 1 column 1: Red", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "U row 2 column 2: White (fixed center)",
      exact: true,
    }),
  ).toBeDisabled();
  await enter(page);
  const input = await page.evaluate(() =>
    localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
  );
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your verified solution", exact: true }),
  ).toBeVisible({ timeout: 50000 });
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page
    .getByRole("button", { name: "Play solution", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).not.toHaveText("0");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next move", exact: true }),
  ).toBeEnabled();
  const paused = await page.getByTestId("playback-step").textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("playback-step")).toHaveText(paused);
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download verified solution", exact: true })
    .click();
  const record = JSON.parse(
    await readFile(await (await downloaded).path(), "utf8"),
  );
  expect(record.input.facelets).toBe(fixture.facelets);
  let verified = record.input;
  for (const token of record.moves)
    verified = apply(verified, parseMove(token, 3));
  expect(verified.facelets).toBe(solved(3).facelets);
  console.log(
    JSON.stringify({
      browserSolver: browserName,
      elapsedMs: Math.round(record.elapsedMs),
      moves: record.moves.length,
    }),
  );
  for (let step = Number(paused); step < record.moves.length; step++)
    await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText(
    String(record.moves.length),
  );
  await page
    .getByText("View all six faces · text alternative", { exact: true })
    .click();
  expect(
    (await page.locator(".playback-net .sticker").allTextContents()).join(""),
  ).toBe(solved(3).facelets);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
    ),
  ).toBe(input);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/m3-solver-${browserName}.png`,
    fullPage: true,
  });
});
test("impossible cubes are rejected and cancellation retains the exact input", async ({
  page,
}) => {
  await ready(page);
  for (const [a, b, issue] of [
    [5, 10, "Edge flip"],
    [10, 19, "parity"],
    [9, 20, "mirrored"],
  ]) {
    const letters = [...solved(3).facelets];
    [letters[a], letters[b]] = [letters[b], letters[a]];
    await enter(page, letters.join(""));
    await page
      .getByRole("button", { name: "Check and solve", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(issue);
    await expect(
      page.getByRole("heading", {
        name: "Your verified solution",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  await enter(page);
  const input = await page.evaluate(() =>
    localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
  );
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel solve", exact: true }).click();
  await expect(page.locator(".solver-status")).toContainText("cancelled");
  await expect(
    page.getByRole("heading", { name: "Your verified solution", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
    ),
  ).toBe(input);
});
test("lessons validate actions, distinguish demonstrations and resume saved progress", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/the-cube/menu.html#/learn");
  await expect(
    page.getByRole("heading", { name: "One move at a time." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption("U");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback")).toContainText("Try R");
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page
    .getByRole("button", { name: "Show next move", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toContainText("0 / 2");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption("R");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toContainText("1 / 2");
  await page.reload();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption("R'");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toContainText(
    "Lesson practiced",
  );
  await expect(page.locator(".learning-heading")).toContainText("1 / 8");
  await page.getByRole("button", { name: "Next lesson", exact: true }).click();
  await expect(page.locator(".lesson-content h2")).toHaveText("Read a move");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/m3-learn-${browserName}.png`,
    fullPage: true,
  });
});
test("failed local saves can retry and corrupt learning records never overwrite existing practice data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.failLearning = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failLearning && key.startsWith("the-cube-lessons-v1:"))
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html#/learn");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("local saving failed");
  await page.evaluate(() => (window.failLearning = false));
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.evaluate(() => {
    window.failLearning = false;
    localStorage.setItem("the-cube-lessons-v1:/the-cube/", "broken progress");
    localStorage.setItem("theCube_savedState", "original data");
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("not been overwritten");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-lessons-v1:/the-cube/"),
    ),
  ).toBe("broken progress");
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe("original data");
});
test("lessons and the actual solver worker remain available when the origin stops", async ({
  page,
  stopOrigin,
}) => {
  test.setTimeout(90000);
  await ready(page);
  await enter(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.goto("/the-cube/menu.html#/learn");
  await expect(
    page.getByRole("heading", { name: "One move at a time." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Solve your own cube", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your verified solution", exact: true }),
  ).toBeVisible({ timeout: 50000 });
});

test("restoring backups updates lesson playback and discards stale solutions; another-tab writes are preserved", async ({
  page,
}) => {
  test.setTimeout(90000);
  await ready(page);
  await page.goto("/the-cube/menu.html#/learn");
  await page.getByText("About this course & backups", { exact: true }).click();
  await page
    .getByLabel("Restore learning backup")
    .setInputFiles({
      name: "lessons.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          lessons: { basics: { revision: 1, step: 1, practiced: 1 } },
        }),
      ),
    });
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await expect(page.locator(".lesson-progress")).toContainText("1 / 2");
  const outside = JSON.stringify({
    version: 1,
    lessons: { basics: { revision: 1, step: 0, practiced: 0 } },
  });
  await page.evaluate(
    (raw) => localStorage.setItem("the-cube-lessons-v1:/the-cube/", raw),
    outside,
  );
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption("R'");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("changed in another tab");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-lessons-v1:/the-cube/"),
    ),
  ).toBe(outside);
  await page.goto("/the-cube/menu.html#/solve");
  await enter(page);
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your verified solution", exact: true }),
  ).toBeVisible({ timeout: 50000 });
  await page.getByText("Your input & solver details", { exact: true }).click();
  await page
    .getByLabel("Restore learning backup")
    .setInputFiles({
      name: "input.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ version: 1, facelets: solved(3).facelets }),
      ),
    });
  await expect(
    page.getByRole("heading", { name: "Your verified solution", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "U row 1 column 1: White", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect(
    page.getByText("This cube is already solved.", { exact: true }),
  ).toBeVisible({ timeout: 50000 });
});

test("worker load failures, deadlines and route exit terminate work without losing input", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    window.workerMode = "fail";
    window.workerStarts = 0;
    window.workerStops = 0;
    window.Worker = class {
      postMessage() {
        window.workerStarts++;
        if (window.workerMode === "fail")
          setTimeout(() => this.onerror?.({}), 10);
      }
      terminate() {
        window.workerStops++;
      }
    };
  });
  await ready(page);
  await enter(page);
  const input = await page.evaluate(() =>
    localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
  );
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("could not load");
  expect(await page.evaluate(() => window.workerStops)).toBe(1);
  await page.evaluate(() => (window.workerMode = "stall"));
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.workerStarts)).toBe(2);
  await page.clock.fastForward(46000);
  await expect(page.getByRole("alert")).toContainText("timed out");
  expect(await page.evaluate(() => window.workerStops)).toBe(2);
  await page
    .getByRole("button", { name: "Check and solve", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.workerStarts)).toBe(3);
  await page.getByRole("link", { name: "Menu", exact: true }).click();
  await expect(page.locator(".menu-grid")).toBeVisible();
  expect(await page.evaluate(() => window.workerStops)).toBe(3);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-solver-input-v1:/the-cube/"),
    ),
  ).toBe(input);
});

test("lesson instructions and state grids work when 3D cannot initialize", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.includes("webgl") ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto("/the-cube/menu.html#/learn");
  await expect(
    page.getByText("3D is unavailable in this browser.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page
    .getByText("View all six faces · text alternative", { exact: true })
    .click();
  expect(
    (await page.locator(".playback-net .sticker").allTextContents()).join(""),
  ).toBe(apply(solved(3), parseMove("R", 3)).facelets);
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption("R'");
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toContainText(
    "Lesson practiced",
  );
});
