import { test, expect } from "./origin-fixture.js";
import AxeBuilder from "@axe-core/playwright";
const key = "the-cube-catalog-v1:/the-cube/";
const openCatalog = async (page) => {
  await page.goto("/the-cube/menu.html#/algorithms");
  await expect(
    page.getByRole("heading", { name: "Find a pattern. Learn its moves." }),
  ).toBeVisible();
};

test("catalog search, variants, ratings, favorites and notation survive reload without practice credit", async ({
  page,
}) => {
  await openCatalog(page);
  await expect(
    page.getByRole("navigation", { name: "Algorithm cases" }).getByRole("link"),
  ).toHaveCount(90);
  await page.getByRole("searchbox", { name: "Search cases" }).fill("Sune");
  await expect(
    page.getByRole("navigation", { name: "Algorithm cases" }).getByRole("link"),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Algorithm cases" })
    .getByRole("link", { name: /H permutation/ })
    .click();
  await expect(page.locator("#catalog-case-title")).toHaveText("H permutation");
  await page
    .getByRole("combobox", { name: "Preferred algorithm" })
    .selectOption("reference");
  await expect(page.getByTestId("next-move")).toHaveText("M2");
  await page
    .getByRole("button", { name: "Favorite case", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "My case rating", exact: true })
    .selectOption("learning");
  await page
    .getByRole("combobox", { name: "My variant rating", exact: true })
    .selectOption("comfortable");
  await page
    .getByRole("slider", { name: "Move timeline", exact: true })
    .press("End");
  await expect(page.getByTestId("playback-step")).toHaveText("7");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) =>
        /^the-cube-(pll|oll|f2l)-v1:/.test(k),
      ),
    ),
  ).toEqual([]);
  await page.getByText("Notation preferences", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Notation font" })
    .selectOption("readable");
  await page
    .getByRole("combobox", { name: "Catalog palette" })
    .selectOption("distinct");
  await expect(page.locator(".catalog-case")).toHaveAttribute(
    "data-catalog-palette",
    "distinct",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Favorite case", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "My variant rating", exact: true }),
  ).toHaveValue("comfortable");
  await expect(page.getByTestId("playback-step")).toHaveText("0");
  await page.getByText("Notation preferences", { exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Notation font" }),
  ).toHaveValue("readable");
  await page.getByRole("button", { name: "Reset notation only" }).click();
  await expect(page.locator(".catalog-case")).toHaveAttribute(
    "data-catalog-palette",
    "original",
  );
  await expect(
    page.getByRole("button", { name: "Favorite case", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Favorites only", { exact: true }).check();
  await expect(
    page.getByRole("navigation", { name: "Algorithm cases" }).getByRole("link"),
  ).toHaveCount(1);
});

test("catalog case links share ratings with trainers and preserve existing repetitions and old URLs", async ({
  page,
}) => {
  await openCatalog(page);
  await page.evaluate(() =>
    localStorage.setItem(
      "the-cube-pll-v1:/the-cube/",
      JSON.stringify({
        version: 1,
        selected: "Ua",
        cases: {
          H: {
            revision: 1,
            step: 0,
            practiced: 0,
            repetitions: 3,
            mistakes: 2,
          },
        },
      }),
    ),
  );
  await page.goto("/the-cube/menu.html#/algorithms?case=H");
  await page
    .getByRole("combobox", { name: "My case rating", exact: true })
    .selectOption("comfortable");
  await page.getByRole("link", { name: "Practice this case →" }).click();
  await expect(page.getByTestId("pll-case-title")).toHaveText("H permutation");
  await expect(page.locator(".pll-progress")).toContainText(
    "3 guided repetitions",
  );
  await page
    .getByText("Favorites, ratings & notation", { exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "My case rating", exact: true }),
  ).toHaveValue("comfortable");
  await page
    .getByRole("combobox", { name: "My variant rating", exact: true })
    .selectOption("learning");
  await page
    .getByRole("link", { name: "Open H permutation in the catalog →" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "My variant rating", exact: true }),
  ).toHaveValue("learning");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("the-cube-pll-v1:/the-cube/")).cases.H,
    ),
  ).toEqual({
    revision: 1,
    step: 0,
    practiced: 0,
    repetitions: 3,
    mistakes: 2,
  });
  for (const [id, route, title] of [
    ["OLL27", "oll", "OLL 27 · Sune"],
    ["F2L-right-insert", "f2l", "Insert with the right face"],
  ]) {
    await page.goto(`/the-cube/menu.html#/algorithms?case=${id}`);
    await page.getByRole("link", { name: "Practice this case →" }).click();
    await expect(page).toHaveURL(new RegExp(`#/${route}\\?case=${id}$`));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
});

test("catalog respects unreadable records and concurrent tab changes", async ({
  page,
  context,
}) => {
  await openCatalog(page);
  await page.evaluate((k) => localStorage.setItem(k, '{"version":99}'), key);
  await page.reload();
  await page
    .getByRole("button", { name: "Favorite case", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("unreadable");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    '{"version":99}',
  );
  await page.evaluate((k) => localStorage.removeItem(k), key);
  await page.reload();
  const second = await context.newPage();
  await openCatalog(second);
  await page
    .getByRole("button", { name: "Favorite case", exact: true })
    .click();
  await second
    .getByRole("combobox", { name: "My case rating", exact: true })
    .selectOption("learning");
  await expect(second.getByRole("alert")).toContainText(
    "changed in another tab",
  );
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  expect(saved.cases.Ua.favorite).toBe(true);
  expect(saved.cases.Ua.rating).toBe("new");
  await second.close();
});

test("catalog stays readable at phone/tablet/desktop widths and supports offline saved favorites", async ({
  page,
  stopOrigin,
}) => {
  await openCatalog(page);
  await page
    .getByRole("button", { name: "Favorite case", exact: true })
    .click();
  await page.getByText("Notation preferences", { exact: true }).click();
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole('combobox', { name: 'Catalog palette' }).selectOption('distinct');
  // Isolate stylesheet contrast from the already-covered preference form flow.
  for (const theme of ['light', 'dark', 'contrast']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await expect
    .poll(() =>
      page.evaluate(async () => !!(await navigator.serviceWorker.ready).active),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Favorite case", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await stopOrigin();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Favorite case", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("playback-step")).toHaveText("1");
});

test('catalog backup round trip and write failure preserve existing trainer records', async ({ page }) => {
  await openCatalog(page);
  await page.evaluate(() => localStorage.setItem('the-cube-pll-v1:/the-cube/', '{"recovery":"preserve bytes"}'));
  await page.getByRole('button', { name: 'Favorite case', exact: true }).click();
  const saved = await page.evaluate(k => localStorage.getItem(k), key);
  await page.getByText('Catalog backup & restore', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download catalog backup' }).click();
  expect((await download).suggestedFilename()).toBe('the-cube-catalog-backup.json');
  await page.getByRole('button', { name: 'Favorite case', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('Restore learning backup').setInputFiles({name:'catalog.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await expect(page.getByRole('button', { name: 'Favorite case', exact: true })).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(() => localStorage.getItem('the-cube-pll-v1:/the-cube/'))).toBe('{"recovery":"preserve bytes"}');
  await page.evaluate(k => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name,value) { if (name===k) throw new DOMException('Full','QuotaExceededError'); return original.call(this,name,value); };
  }, key);
  await page.getByRole('combobox',{name:'My case rating',exact:true}).selectOption('learning');
  await expect(page.getByRole('alert')).toContainText('only in memory');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(saved);
});
