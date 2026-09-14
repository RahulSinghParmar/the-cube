import { test, expect } from "./origin-fixture.js";
import { PLL_CASES } from "../../packages/academy/dist/index.js";
const key = "the-cube-pll-recognition-v1:/the-cube/";
async function open(page) {
  await page.goto("/the-cube/menu.html#/recognize");
  await expect(
    page.getByRole("heading", { name: "Know the pattern." }),
  ).toBeVisible();
}
async function identify(page) {
  const stickers = (
    await page.locator(".recognition-net .sticker").allTextContents()
  ).join("");
  return PLL_CASES.find((item) => item.facelets === stickers).id;
}
async function answer(page, id) {
  await page
    .getByRole("combobox", { name: "Your answer", exact: true })
    .selectOption(id);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
}
test("random recognition hides instructions, gives honest feedback and saves correct/missed history", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await expect(page.getByTestId("recognition-clock")).toHaveText("Untimed");
  await expect(page.locator(".sequence-player")).toHaveCount(0);
  const first = await identify(page);
  await answer(page, first === "Ua" ? "T" : "Ua");
  await expect(
    page.getByRole("heading", { name: `Not quite — ${first}`, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recognition-stats")).toContainText("0%");
  await page.getByText("Explain with 3D playback", { exact: true }).click();
  await expect(page.locator(".sequence-player canvas")).toBeVisible();
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
  await page.getByRole("button", { name: "Next pattern", exact: true }).click();
  const second = await identify(page);
  expect(second).not.toBe(first);
  await answer(page, second);
  await expect(
    page.getByRole("heading", { name: `Correct — ${second}`, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recognition-stats")).toContainText("50%");
  await page.reload();
  await expect(page.locator(".recognition-stats")).toContainText("1 / 2");
  await page
    .getByText("Recognition history & backups", { exact: true })
    .click();
  await expect(page.locator(".recognition-history li")).toHaveCount(2);
  expect(
    JSON.parse(
      await page.evaluate((k) => localStorage.getItem(k), key),
    ).history.every((item) => item.elapsedMs === null),
  ).toBe(true);
});
test("optional timing, reveals and interrupted rounds retain accurate statistics", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("Time my answers", { exact: true }).check();
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  const first = await identify(page);
  await answer(page, first);
  await expect(page.locator(".recognition-stats")).toContainText("(1 timed)");
  let saved = JSON.parse(
    await page.evaluate((k) => localStorage.getItem(k), key),
  );
  expect(saved.history[0].elapsedMs).toBeGreaterThanOrEqual(0);
  await page.getByRole("button", { name: "Next pattern", exact: true }).click();
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  await expect(page.locator(".recognition-stats")).toContainText("50%");
  await page.getByRole("button", { name: "Next pattern", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByText("Round interrupted while the app was hidden.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".recognition-stats")).toContainText("1 / 2");
  await expect(
    page.getByLabel("Time my answers", { exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".recognition-stats")).toContainText("1 / 2");
});
test("recognition exports and restores independently, retries failed writes and protects malformed history", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    window.failRecognition = false;
    Storage.prototype.setItem = function (k, v) {
      if (window.failRecognition && k.includes("pll-recognition"))
        throw new DOMException("Full", "QuotaExceededError");
      return set.call(this, k, v);
    };
  });
  await open(page);
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await page.evaluate(() => (window.failRecognition = true));
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("local saving failed");
  await expect(
    page.getByRole("button", { name: "Next pattern", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => (window.failRecognition = false));
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await page
    .getByText("Recognition history & backups", { exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download recognition history", exact: true })
    .click();
  const backup = await (await download).path();
  await page.getByRole("button", { name: "Next pattern", exact: true }).click();
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  await page.getByLabel("Restore learning backup").setInputFiles(backup);
  await expect(page.locator(".recognition-stats")).toContainText("0 / 1");
  await expect(page.locator(".recognition-feedback")).toHaveCount(0);
  const before = await page.evaluate((k) => localStorage.getItem(k), key);
  await page
    .getByLabel("Restore learning backup")
    .setInputFiles({
      name: "wrong.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":1,"selected":"Ua","cases":{}}'),
    });
  await expect(page.getByRole("alert")).toContainText("could not be verified");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(before);
  await page.evaluate((k) => {
    localStorage.setItem(k, "broken history");
    localStorage.setItem(
      "the-cube-pll-v1:/the-cube/",
      "preserved guided progress",
    );
  }, key);
  await page.reload();
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "broken history",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("the-cube-pll-v1:/the-cube/"),
    ),
  ).toBe("preserved guided progress");
});
test("another tab cannot silently replace recognition results", async ({
  page,
  context,
}) => {
  await open(page);
  const other = await context.newPage();
  await open(other);
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  const original = await page.evaluate((k) => localStorage.getItem(k), key);
  await other
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await other.getByRole("button", { name: "Reveal case", exact: true }).click();
  await expect(other.getByRole("alert")).toContainText("another tab");
  expect(await other.evaluate((k) => localStorage.getItem(k), key)).toBe(
    original,
  );
  await other.close();
});
test("recognition is reachable offline, works without WebGL and fits narrow screens", async ({
  page,
  stopOrigin,
  browserName,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.includes("webgl") ? null : get.call(this, kind, ...args);
    };
  });
  await page.goto("/the-cube/menu.html#/train");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page
    .getByRole("link", { name: "Try recognition drills →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start recognition", exact: true })
    .click();
  await expect(
    page.getByText(
      "3D is unavailable. The pattern and face grids still work.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/recognition-phone-${browserName}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reveal case", exact: true }).click();
  await page.reload();
  await expect(page.locator(".recognition-stats")).toContainText("0 / 1");
});
