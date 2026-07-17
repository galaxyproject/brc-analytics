import { GA2_ROUTES } from "../../../app/routes/constants";
import { ROUTES } from "../../../packages/core/routes/constants";
import { expect, test } from "../utils/fixtures";

const PAGES = [
  { name: "About", url: GA2_ROUTES.ABOUT },
  { name: "Partner Resources", url: GA2_ROUTES.ABOUT_PARTNER_RESOURCES },
  { name: "Roadmap", url: GA2_ROUTES.ABOUT_ROADMAP },
  { name: "Organisms", url: ROUTES.ORGANISMS },
  { name: "Assemblies", url: ROUTES.GENOMES },
  { name: "Workflows", url: ROUTES.WORKFLOWS },
];

test.describe("Genome Ark 2 - UI Smoke Tests", () => {
  test("homepage should load", async ({ page }) => {
    await page.goto("/");

    // Page should have a title
    await expect(page).toHaveTitle(/Genome Ark 2$/);
  });

  test("navigation should be present", async ({ page }) => {
    await page.goto("/");

    // Header should be visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Navigation should be visible
    const navigation = page.getByTestId("navigation");
    await expect(navigation).toBeVisible();
  });

  for (const { name, url } of PAGES) {
    test(`${name} page should load`, async ({ page }) => {
      await page.goto(url);

      // Page should have title
      await expect(page).toHaveTitle(/Genome Ark 2$/);

      // Page should have content
      await expect(page.locator("main")).toBeVisible();

      // Page heading should be visible
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});
