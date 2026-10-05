import { devices, type Page } from "@playwright/test";
import { expect, test } from "./utils/fixtures";

const BLOG_PATH =
  "/learn/blog/genotyping-cyclospora-assessing-current-practices";

/**
 * Waits for the post to render and asserts the long unbreakable inline-code
 * token that both cases depend on is present — so a content edit that removes
 * it fails loudly here rather than reading as a mysterious CSS regression.
 * @param page - The Playwright page.
 */
async function expectPostWithLongToken(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", {
      name: /genotyping cyclospora/i,
    })
  ).toBeVisible();
  await expect(
    page.locator("code", {
      hasText: "REFERENCE_CLUSTER_LIST/2018_gold_clusters.txt",
    })
  ).toBeVisible();
}

/**
 * Returns whether the page overflows its viewport horizontally.
 * @param page - The Playwright page.
 * @returns True when the page scrolls horizontally.
 */
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    // 1px tolerance absorbs scrollbar and sub-pixel rounding noise.
    return el.scrollWidth > el.clientWidth + 1;
  });
}

test.describe("Blog post on mobile", () => {
  // Viewport-only emulation: the assertion is pure CSS layout, and the full
  // device descriptor sets isMobile, which Firefox doesn't support.
  test.use({ viewport: devices["iPhone 12"].viewport });

  test("long inline-code tokens wrap instead of widening the page", async ({
    page,
  }) => {
    await page.goto(BLOG_PATH);

    // The post's references include long unbroken inline-code tokens; the
    // page must not overflow the viewport horizontally.
    await expectPostWithLongToken(page);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("detects the overflow when the wrap rule is neutralized", async ({
    page,
  }) => {
    await page.goto(BLOG_PATH);

    // Wait for the post to render before measuring layout.
    await expectPostWithLongToken(page);

    // Inversion check: with the fix disabled, the long tokens must overflow —
    // proving the wrap rule is load-bearing and this spec detects its loss.
    await page.addStyleTag({
      content: "code { overflow-wrap: normal !important; }",
    });
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(true);
  });
});
