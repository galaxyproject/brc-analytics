import { type Page } from "@playwright/test";
import { expect, test } from "./utils/fixtures";

/** Width of the content column the cards page within. */
const CONTENT_WIDTH = 1136;
/** Matches the title however its apostrophe is written. */
const TITLE = /What.s New/;
const BACK = "Show previous updates";
const FORWARD = "Show more updates";
/** Matches the row's transition, so each page turn lands before the next click. */
const PAGE_TURN_MS = 350;

/**
 * Pages the row to its last card.
 * @param page - Playwright page.
 */
async function pageToEnd(page: Page): Promise<void> {
  const forward = page.getByRole("button", { name: FORWARD });
  while (await forward.isEnabled()) {
    await forward.click();
    await page.waitForTimeout(PAGE_TURN_MS);
  }
}

test.describe("BRC Analytics - What's New", () => {
  test("the section lists the latest updates", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(TITLE)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Learn more & apply" })
    ).toBeVisible();
  });

  test("paging starts at the first card and stops at the last", async ({
    page,
  }) => {
    await page.goto("/");

    const back = page.getByRole("button", { name: BACK });
    const forward = page.getByRole("button", { name: FORWARD });
    await expect(back).toBeDisabled();
    await expect(forward).toBeEnabled();

    await pageToEnd(page);

    await expect(forward).toBeDisabled();
    await expect(back).toBeEnabled();
  });

  test("the last card comes to rest inside the content column", async ({
    page,
  }) => {
    // The row bleeds past the column so the next cards show, but paging has to
    // end with the final card back inside it -- not cut off at the page edge.
    await page.setViewportSize({ height: 900, width: 1800 });
    await page.goto("/");

    await pageToEnd(page);
    await expect(page.getByRole("button", { name: FORWARD })).toBeDisabled();

    const headline = await page.getByText(TITLE).boundingBox();
    // Scoped to the section: later sections on the home page render cards too,
    // and the last of those would be measured instead of the last card here.
    const cards = page
      .locator("section")
      .filter({ hasText: TITLE })
      .locator(".MuiCard-root");
    const last = await cards.nth((await cards.count()) - 1).boundingBox();
    expect(last?.x).toBeGreaterThanOrEqual(headline?.x ?? 0);
    expect(last?.x ?? 0).toBeLessThanOrEqual(
      (headline?.x ?? 0) + CONTENT_WIDTH
    );
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeLessThanOrEqual(
      (headline?.x ?? 0) + CONTENT_WIDTH + 1
    );
  });

  test("paging forward moves the cards, and back returns them", async ({
    page,
  }) => {
    await page.goto("/");

    const card = page.getByText("NIAID BRC AI Codeathon 2.0");
    const start = (await card.boundingBox())?.x ?? 0;

    await page.getByRole("button", { name: FORWARD }).click();
    await expect
      .poll(async () => (await card.boundingBox())?.x ?? 0)
      .toBeLessThan(start);

    await page.waitForTimeout(PAGE_TURN_MS);
    await page.getByRole("button", { name: BACK }).click();
    await expect
      .poll(async () => (await card.boundingBox())?.x ?? 0)
      .toBe(start);
  });
});
