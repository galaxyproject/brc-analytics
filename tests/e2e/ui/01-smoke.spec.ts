import { test, expect } from "@playwright/test";
import { ROUTES } from "../../../routes/constants";

const PAGES = [
  { name: "About", url: ROUTES.ABOUT },
  { name: "Learn", url: ROUTES.LEARN },
  { name: "Organisms", url: ROUTES.ORGANISMS },
  { name: "Assemblies", url: ROUTES.GENOMES },
  { name: "Priority Pathogens", url: ROUTES.PRIORITY_PATHOGENS },
  { name: "Roadmap", url: ROUTES.ROADMAP },
  { name: "Calendar", url: ROUTES.CALENDAR },
];

test.describe("BRC Analytics - UI Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Block analytics requests - Firefox has slow TLS handshake to plausible.galaxyproject.eu
    await page.route("**/plausible.galaxyproject.eu/**", (route) =>
      route.abort()
    );
  });

  test("homepage should load", async ({ page }) => {
    await page.goto("/");

    // Page should have a title
    await expect(page).toHaveTitle(/BRC Analytics$/);
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

  PAGES.forEach(({ name, url }) => {
    test(`${name} page should load`, async ({ page }) => {
      await page.goto(url);

      // Page should have title
      await expect(page).toHaveTitle(/BRC Analytics$/);

      // Page should have content
      await expect(page.locator("main")).toBeVisible();
    });
  });
});
