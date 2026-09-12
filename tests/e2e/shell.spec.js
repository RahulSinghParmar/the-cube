import { test, expect } from "./origin-fixture.js";
import { readFile } from "node:fs/promises";

async function ready(page) {
  await page.goto("/the-cube/menu.html#/play");
  await expect(
    page.getByRole("heading", { name: "Make your next move." }),
  ).toBeVisible();
  await expect(page.locator(".cube-view canvas")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.getByText("An update is ready.", { exact: false })).toHaveCount(0);
}
const count = (page) => page.getByTestId("move-count");
async function settled(page) {
  await expect(page.getByTestId("queue-count")).toHaveText("0");
}
test("virtual attempt starts on a face move and stops on a verified solution", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.getByRole("button", { name: "Scramble", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const sequence = await page.evaluate(
    () => JSON.parse(localStorage.getItem("the-cube-v2:/the-cube/")).moves,
  );
  await page.getByRole("region", { name: "Interactive cube" }).focus();
  await page.keyboard.press("x");
  await settled(page);
  await page.keyboard.press("Shift+x");
  await settled(page);
  await expect(page.locator(".virtual-time")).toContainText("0:00.00");
  for (const token of sequence.reverse()) {
    for (let turn = 0; turn < (token.endsWith("2") ? 2 : 1); turn++) {
      const direction = token.endsWith("'") ? "clockwise" : "counterclockwise";
      await page
        .getByRole("button", { name: `${token[0]} ${direction}`, exact: true })
        .click();
      await settled(page);
    }
  }
  await expect(page.locator(".state-pill")).toHaveText("Solved");
  await expect(page.locator(".save-status")).toContainText("Solved");
  await expect(page.locator(".virtual-time")).not.toContainText("0:00.00");
  const stopped = await page.locator(".virtual-time").textContent();
  await page.getByRole("button", { name: "Rotate y", exact: true }).click();
  await settled(page);
  await expect(page.locator(".virtual-time")).toHaveText(stopped);
});
test("new renderer, queued keyboard moves, inverse, checkpoint reload and offline deep links", async ({
  page,
  stopOrigin,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.getByRole("region", { name: "Interactive cube" }).focus();
  await page.keyboard.type("jifk");
  await settled(page);
  await expect(count(page)).toHaveText("4");
  await expect(page.getByTestId("move-sequence")).toHaveText("U R U' R'");
  await page.keyboard.type("ijfk");
  await settled(page);
  await expect(count(page)).toHaveText("8");
  const stored = await page.evaluate(() =>
    localStorage.getItem("the-cube-v2:/the-cube/"),
  );
  expect(stored).toBeTruthy();
  await page.reload();
  await expect(count(page)).toHaveText("8");
  expect(
    await page.evaluate(() => localStorage.getItem("the-cube-v2:/the-cube/")),
  ).toBe(stored);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.goto("/the-cube/menu.html#/settings");
  await expect(
    page.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("settings validate key collisions, persist themes and locale, and remapping controls the cube", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Key for U", { exact: true }).fill("f");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert")).toContainText("different letters");
  await page.getByLabel("Key for U", { exact: true }).fill("a");
  await page.getByRole("combobox", { name: "Appearance" }).selectOption("dark");
  await page.getByLabel("Reduce motion").check();
  await page.getByLabel("Show face letters").check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Practice", exact: true }).click();
  await page.getByRole("region", { name: "Interactive cube" }).focus();
  await page.keyboard.press("a");
  await settled(page);
  await expect(count(page)).toHaveText("1");
  await page.keyboard.press("j");
  await expect(count(page)).toHaveText("1");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("combobox", { name: "Language" }).selectOption("hi");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "अपनी पसंद से खेलें।" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "अभ्यास", exact: true }).click();
  await expect(page.locator(".cube-view canvas")).toHaveCount(1);
});
test("all sizes render, reset needs review, mobile controls work and cube backup roundtrips", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await ready(page);
  for (const size of [2, 4, 5, 3]) {
    await page
      .getByRole("combobox", { name: "Cube size" })
      .selectOption(String(size));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".cube-view canvas")).toHaveCount(1);
    await page
      .getByRole("button", { name: "R clockwise", exact: true })
      .click();
    await settled(page);
    await expect(count(page)).toHaveText("1");
  }
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export cube", exact: true }).click();
  const file = await event;
  const bytes = await readFile(await file.path());
  await page.getByRole("button", { name: "Reset cube", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(count(page)).toHaveText("1");
  await page.getByRole("button", { name: "Reset cube", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(count(page)).toHaveText("0");
  await page.getByLabel("Import cube", { exact: true }).setInputFiles({
    name: "cube.json",
    mimeType: "application/json",
    buffer: bytes,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(count(page)).toHaveText("1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/m2-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "test-results/m2-desktop.png",
    fullPage: true,
  });
});
test("legacy saved game remains untouched and invalid new checkpoints are preserved", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("theCube_playing", "true");
    localStorage.setItem("theCube_savedState", "original geometry");
    localStorage.setItem("the-cube-v2:/the-cube/", '{"broken":true}');
  });
  await page.goto("/the-cube/menu.html#/play");
  await expect(page.getByRole("alert")).toContainText("not been overwritten");
  await expect(
    page.getByRole("link", { name: "Resume original saved game" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "R clockwise", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("theCube_savedState")),
  ).toBe("original geometry");
  expect(
    await page.evaluate(() => localStorage.getItem("the-cube-v2:/the-cube/")),
  ).toBe('{"broken":true}');
});
