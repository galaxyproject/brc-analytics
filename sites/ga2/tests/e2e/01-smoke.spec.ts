import { ROUTES } from "@repo/shared/routes/constants";
import { expect, test } from "./utils/fixtures";

const ASSEMBLY = {
  description:
    "Genome assembly GCA_003287225.2 of Phascolarctos cinereus, at scaffold level, with 1,245 scaffolds, totaling 3,192,623,321 bp.",
  title: "Phascolarctos cinereus (GCA_003287225.2) - Genome Ark 2",
  url: `${ROUTES.GENOMES}/GCA_003287225_2`,
};

const PAGES = [
  { name: "About", url: "/about" },
  { name: "Partner Resources", url: "/about/partner-resources" },
  { name: "Roadmap", url: "/about/roadmap" },
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

  test("assembly page should have its own title and description", async ({
    page,
  }) => {
    await page.goto(ASSEMBLY.url);

    await expect(page).toHaveTitle(ASSEMBLY.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      ASSEMBLY.description
    );
  });
});
