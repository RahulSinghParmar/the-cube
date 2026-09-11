import { test, expect } from "./origin-fixture.js";
test("M1 timer survives new shell navigation and remains usable offline", async ({
  page,
  stopOrigin,
}) => {
  await page.goto("/the-cube/");
  await page.getByRole("link", { name: "Timer", exact: true }).click();
  await page
    .getByRole("button", { name: "Start without holding", exact: true })
    .click();
  await page.getByRole("button", { name: "Stop timer", exact: true }).click();
  await expect(page.locator("#stat-count")).toHaveText("1");
  await page.reload();
  await expect(page.locator("#stat-count")).toHaveText("1");
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await stopOrigin();
  await page.reload();
  await expect(page.locator("#stat-count")).toHaveText("1");
  await page.getByRole("link", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make your next move." }),
  ).toBeVisible();
});
