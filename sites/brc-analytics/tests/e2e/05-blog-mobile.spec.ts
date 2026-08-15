import { devices, type Page } from "@playwright/test";
import { expect, test } from "./utils/fixtures";

const BLOG_PATH =
  "/learn/blog/genotyping-cyclospora-assessing-current-practices";

/**
 * Returns whether the page overflows its viewport horizontally.
 * @param page - The Playwright page.
 * @returns True when the page scrolls horizontally.
 */
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.scrollingElement;
    return !!el && el.scrollWidth > el.clientWidth;
  });
}

test.describe("Blog post on mobile", () => {
  test.use({ viewport: devices["iPhone 12"].viewport });

  test("long inline-code tokens wrap instead of widening the page", async ({
    page,
  }) => {
    await page.goto(BLOG_PATH);

    // The post's references include long unbroken inline-code tokens; the
    // page must not overflow the viewport horizontally.
    await expect(
      page.getByRole("heading", {
        name: /genotyping cyclospora/i,
      })
    ).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});
