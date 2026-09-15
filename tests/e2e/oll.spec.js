import { test, expect } from "./origin-fixture.js";
import {
  OLL_CASES,
  ollMoves,
  newOLLRecord,
  ollName,
} from "../../packages/academy/dist/index.js";
import { solved } from "../../packages/cube-core/dist/index.js";
const key = "the-cube-oll-v1:/the-cube/";
async function open(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-cube/menu.html#/oll");
  await expect(
    page.getByRole("heading", { name: "Orient the last layer." }),
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

test("OLL library exposes 57 checked cases, diagrams, filtering and responsive playback", async ({
  page,
  browserName,
}) => {
  await open(page);
  for (const item of OLL_CASES) {
    await page
      .getByLabel("Choose an OLL case", { exact: true })
      .selectOption(item.id);
    await expect(page.getByTestId("oll-case-title")).toHaveText(
      ollName(item.id),
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.locator(".cube-view canvas")).toBeVisible();
  }
  await page
    .getByLabel("Choose an OLL case", { exact: true })
    .selectOption("OLL1");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
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
    .getByLabel("Filter patterns", { exact: true })
    .selectOption("cross");
  await expect(
    page
      .getByRole("group", { name: "OLL cases", exact: true })
      .getByRole("button"),
  ).toHaveCount(7);
  await page.screenshot({
    path: `test-results/oll-desktop-${browserName}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await expect(page.getByTestId("oll-case-title")).toHaveText("OLL 1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/oll-phone-${browserName}.png`,
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
  await expect(page.locator(".pll-progress")).toContainText("0 / 7");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await applyMove(page, "R");
  await page.reload();
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  for (const token of ollMoves("OLL27").slice(1)) await applyMove(page, token);
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
  ).toBe("UUUUUUUUU");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await applyMove(page, "R'");
  await expect(page.locator(".pll-progress")).toContainText(
    "1 guided repetition",
  );
  await page
    .getByRole("button", { name: "Start new repetition", exact: true })
    .click();
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await expect(page.locator(".pll-progress")).toContainText("0 / 7");
  await expect(page.locator(".pll-progress")).toContainText(
    "1 guided repetition",
  );
  await page
    .getByLabel("Choose an OLL case", { exact: true })
    .selectOption("OLL26");
  await page.reload();
  await expect(page.getByTestId("oll-case-title")).toHaveText(
    "OLL 26 · Anti-Sune",
  );
  expect(
    JSON.parse(await page.evaluate((k) => localStorage.getItem(k), key)).cases
      .OLL27.repetitions,
  ).toBe(1);
});

test("OLL backup restoration, write recovery and malformed records preserve older saved data", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    window.failOLL = false;
    Storage.prototype.setItem = function (k, v) {
      if (window.failOLL && k.startsWith("the-cube-oll-v1:"))
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, k, v);
    };
  });
  await open(page);
  await page.evaluate(() => (window.failOLL = true));
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  await expect(page.getByRole("alert")).toContainText("local saving failed");
  await page.evaluate(() => (window.failOLL = false));
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByText("Progress backups & algorithm sources", { exact: true })
    .click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download OLL progress", exact: true })
    .click();
  const backup = await (await downloaded).path();
  await page
    .getByLabel("Choose an OLL case", { exact: true })
    .selectOption("OLL1");
  await page.getByLabel("Restore learning backup").setInputFiles(backup);
  await expect(page.getByTestId("oll-case-title")).toHaveText("OLL 27 · Sune");
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
    localStorage.setItem(k, "broken OLL record");
    localStorage.setItem(
      "the-cube-lessons-v1:/the-cube/",
      JSON.stringify({ version: 1, lessons: {} }),
    );
    localStorage.setItem("theCube_savedState", "preserved original");
  }, key);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("not been overwritten");
  await page
    .getByRole("button", { name: "Practice moves", exact: true })
    .click();
  await applyMove(page, "R");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "broken OLL record",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe("preserved original");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-lessons-v1:/the-cube/"),
    ),
  ).toBe('{"version":1,"lessons":{}}');
});

test("OLL loads offline from the menu and remains usable without 3D", async ({
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
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.getByRole("link", { name: "Learn OLL →", exact: true }).click();
  await expect(page.getByTestId("oll-case-title")).toHaveText("OLL 27 · Sune");
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
