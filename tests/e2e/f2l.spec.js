import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./origin-fixture.js";
import { F2L_CASES, f2lMoves } from "../../packages/academy/dist/index.js";
import { solved } from "../../packages/cube-core/dist/index.js";
const key = "the-cube-f2l-v1:/the-cube/";
async function open(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html#/f2l");
  await expect(
    page.getByRole("heading", { name: "Two pieces. One pair." }),
  ).toBeVisible();
}
async function applyMove(page, token) {
  await page
    .getByRole("combobox", { name: "Your move", exact: true })
    .selectOption(token);
  await page
    .getByRole("button", { name: "Apply my move", exact: true })
    .click();
}

test("F2L library exposes 12 checked setups, explanations, filtering and responsive playback", async ({
  page,
  browserName,
}) => {
  await open(page);
  for (const item of F2L_CASES) {
    await page
      .getByLabel("Choose an F2L setup", { exact: true })
      .selectOption(item.id);
    await expect(page.getByTestId("f2l-case-title")).toHaveText(item.title);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.locator(".cube-view canvas")).toBeVisible();
  }
  await page
    .getByLabel("Choose an F2L setup", { exact: true })
    .selectOption("F2L-align-right");
  await page
    .getByText("Find the two pieces at this step", { exact: true })
    .click();
  const beforeGuide = await page.locator(".f2l-step-guide ul").innerText();
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.locator(".f2l-step-guide ul")).not.toHaveText(beforeGuide);
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page
    .getByRole("button", { name: "Play solution", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).not.toHaveText("0");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".pll-progress")).toContainText(
    "0 guided repetitions",
  );
  await page
    .getByText("Browse 12 guided setups", { exact: true })
    .evaluate((el) => {
      el.parentElement.open = true;
    });
  await page.getByLabel("Filter setups", { exact: true }).selectOption("ready");
  await expect(
    page
      .getByRole("group", { name: "F2L setups", exact: true })
      .getByRole("button"),
  ).toHaveCount(4);
  await page.screenshot({
    path: `test-results/f2l-desktop-${browserName}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await expect(page.getByTestId("f2l-case-title")).toHaveText(
    "Line up a right insertion",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/f2l-phone-${browserName}.png`,
    fullPage: true,
  });
});

test("guided practice rejects wrong moves, preserves partial work and counts each complete repetition once", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "U");
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await expect(page.locator(".pll-progress")).toContainText(
    "1 incorrect choice",
  );
  await page
    .getByRole("button", { name: "Show next move", exact: true })
    .click();
  await expect(page.locator(".pll-progress")).toContainText("0 / 3");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await applyMove(page, "R");
  await page.reload();
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  for (const token of f2lMoves("F2L-right-insert").slice(1))
    await applyMove(page, token);
  await expect(page.locator(".pll-progress")).toContainText(
    "1 guided repetition",
  );
  await page
    .getByText("View all six faces · text alternative", { exact: true })
    .click();
  expect(
    (await page.locator(".playback-net .sticker").allTextContents()).join(""),
  ).not.toBe(solved(3).facelets);
  expect(
    (await page.locator(".playback-net .sticker").allTextContents())
      .slice(0, 9)
      .join(""),
  ).not.toBe("UUUUUUUUU");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await applyMove(page, "R'");
  await expect(page.locator(".pll-progress")).toContainText(
    "1 guided repetition",
  );
  await page
    .getByRole("button", { name: "Start new repetition", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await expect(page.locator(".pll-progress")).toContainText("0 / 3");
  await expect(page.locator(".pll-progress")).toContainText(
    "1 guided repetition",
  );
  await page
    .getByLabel("Choose an F2L setup", { exact: true })
    .selectOption("F2L-front-insert");
  await page.reload();
  await expect(page.getByTestId("f2l-case-title")).toHaveText(
    "Insert with the front face",
  );
  expect(
    JSON.parse(await page.evaluate((k) => localStorage.getItem(k), key)).cases[
      "F2L-right-insert"
    ].repetitions,
  ).toBe(1);
});

test("F2L backup restoration, write recovery and malformed records preserve older saved data", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    window.failF2L = false;
    Storage.prototype.setItem = function (k, v) {
      if (window.failF2L && k.startsWith("the-cube-f2l-v1:"))
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await open(page);
  await page.evaluate(() => (window.failF2L = true));
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  await expect(page.getByRole("alert")).toContainText("local saving failed");
  await page.evaluate(() => (window.failF2L = false));
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByText("Progress backups & learning sources", { exact: true })
    .click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download F2L progress", exact: true })
    .click();
  const backup = await (await downloaded).path();
  await page
    .getByLabel("Choose an F2L setup", { exact: true })
    .selectOption("F2L-align-right");
  await page.getByLabel("Restore learning backup").setInputFiles(backup);
  await expect(page.getByTestId("f2l-case-title")).toHaveText(
    "Insert with the right face",
  );
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  const before = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.getByLabel("Restore learning backup").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ version: 1, lessons: {} })),
  });
  await expect(page.getByRole("alert")).toContainText("could not be verified");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(before);
  await page.evaluate((k) => {
    localStorage.setItem(k, "broken F2L record");
    localStorage.setItem(
      "the-cube-lessons-v1:/the-cube/",
      JSON.stringify({ version: 1, lessons: {} }),
    );
    localStorage.setItem("theCube_savedState", "preserved original");
    localStorage.setItem(
      "the-cube-oll-v1:/the-cube/",
      JSON.stringify({ version: 1, selected: "OLL27", cases: {} }),
    );
  }, key);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("not been overwritten");
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "broken F2L record",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe("preserved original");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-lessons-v1:/the-cube/"),
    ),
  ).toBe('{"version":1,"lessons":{}}');
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-oll-v1:/the-cube/"),
    ),
  ).toBe('{"version":1,"selected":"OLL27","cases":{}}');
});

test("F2L loads offline from the menu and remains usable without 3D", async ({
  page,
  stopOrigin,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.includes("webgl") ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto("/the-cube/menu.html#/train");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.contrf2ler !== null);
  await stopOrigin();
  await page.getByRole("link", { name: "Learn F2L →", exact: true }).click();
  await expect(page.getByTestId("f2l-case-title")).toHaveText(
    "Insert with the right face",
  );
  await expect(
    page.getByText("3D is unavailable in this browser.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.reload();
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
});

test("F2L is accessible on tablet and detects another tab without overwriting it", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await open(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const second = await context.newPage();
  await second.goto(page.url());
  await expect(second.getByTestId("f2l-case-title")).toBeVisible();
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  const saved = await page.evaluate((k) => localStorage.getItem(k), key);
  await second
    .getByLabel("Choose an F2L setup", { exact: true })
    .selectOption("F2L-slot-repair");
  await expect(second.getByRole("alert")).toContainText(
    "changed in another tab",
  );
  expect(await second.evaluate((k) => localStorage.getItem(k), key)).toBe(
    saved,
  );
  await second.reload();
  await second
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await expect(second.getByTestId("playback-step")).toHaveText("1");
  await second.close();
});
