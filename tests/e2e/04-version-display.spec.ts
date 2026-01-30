import { expect, test } from "@playwright/test";

test.describe("Version Display", () => {
  test("should show client version and backend version in footer", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");

    // Wait for the footer to be visible
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check for client version (always present)
    await expect(footer).toContainText("Client build:");

    // Check for backend version (should appear after API call)
    await expect(footer).toContainText("Server revision:", { timeout: 5000 });

    // Verify both show 0.15.0
    const versionText = await footer.textContent();
    console.log("Version display:", versionText);
    expect(versionText).toMatch(/Client build:.*0\.15\.0/);
    expect(versionText).toMatch(/Server revision:.*0\.15\.0/);
  });

  test("should gracefully handle backend unavailable", async ({ page }) => {
    // Block the API call to simulate backend unavailable
    await page.route("**/api/v1/version", (route) => route.abort("failed"));

    await page.goto("http://localhost:3000");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Should still show client version
    await expect(footer).toContainText("Client build:");

    // Should NOT show server revision
    const versionText = await footer.textContent();
    expect(versionText).not.toContain("Server revision:");
  });
});
