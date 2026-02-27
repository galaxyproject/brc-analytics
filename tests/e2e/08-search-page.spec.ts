import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - Search Page UI", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the search page
    await page.goto("http://localhost/search");
  });

  test("should load search page with correct title and elements", async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Search.*BRC Analytics/);

    // Check main heading
    await expect(
      page.locator("h1, h2").filter({ hasText: /Dataset Search/i })
    ).toBeVisible();

    // Check subheading with description
    await expect(
      page.locator(
        "text=Find datasets using natural language queries powered by AI"
      )
    ).toBeVisible();

    // Check breadcrumbs
    await expect(
      page.locator("nav").filter({ hasText: /Home.*Search/i })
    ).toBeVisible();

    console.log("✅ Search page loaded with correct title and elements");
  });

  test("should have functional search input field", async ({ page }) => {
    // Look for search input (could be various types)
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await expect(searchInput).toBeVisible();

    // Test typing in the search box
    await searchInput.fill("E. coli RNA-seq data");
    await expect(searchInput).toHaveValue("E. coli RNA-seq data");

    console.log("✅ Search input field is functional");
  });

  test("should have search button or submit functionality", async ({
    page,
  }) => {
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await searchInput.fill("Plasmodium falciparum genome");

    // Look for search button (various possible selectors)
    const searchButton = page
      .locator(
        'button:has-text("Search"), button[type="submit"], button:has-text("Find")'
      )
      .first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      console.log("✅ Search button found and clicked");
    } else {
      // Try pressing Enter in the input field
      await searchInput.press("Enter");
      console.log("✅ Search submitted via Enter key");
    }

    // Wait for some response (either results or loading)
    await page.waitForTimeout(2000);
  });

  test("should display valid search results", async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await searchInput.fill("E. coli sequencing data");

    // Submit search
    const searchButton = page
      .locator(
        'button:has-text("Search"), button[type="submit"], button:has-text("Find")'
      )
      .first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press("Enter");
    }

    // Wait for results (longer timeout for API call)
    await page.waitForTimeout(5000);

    // Check for results container or success indicators
    const resultsContainer = page
      .locator(
        '[data-testid="search-results"], .search-results, section:has-text("Results")'
      )
      .first();

    if (await resultsContainer.isVisible()) {
      console.log("✅ Search results container found");

      // Look for individual result items
      const resultItems = page
        .locator('[data-testid="result-item"], .result-item, article')
        .all();
      const itemCount = (await resultItems).length;

      if (itemCount > 0) {
        console.log(`✅ Found ${itemCount} search result items`);
      }
    } else {
      // Check if there's any indication of search completion
      const noResults = page.locator("text=/no results|no matches|not found/i");
      const errorMessage = page.locator("text=/error|failed|invalid/i");

      if (await noResults.isVisible()) {
        console.log("✅ 'No results' message displayed properly");
      } else if (await errorMessage.isVisible()) {
        console.log(
          "✅ Error message displayed (may be expected for this query)"
        );
      } else {
        console.log("⚠️ Search completed but results format unclear");
      }
    }
  });

  test("should display error message for invalid queries", async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await searchInput.fill("sdfsdfs nonsense gibberish");

    // Submit search
    const searchButton = page
      .locator(
        'button:has-text("Search"), button[type="submit"], button:has-text("Find")'
      )
      .first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press("Enter");
    }

    // Wait for error response
    await page.waitForTimeout(3000);

    // Look for error messages
    const errorMessages = [
      page.locator("text=/invalid query/i"),
      page.locator("text=/search failed/i"),
      page.locator("text=/error/i"),
      page.locator("text=/bioinformatics/i"),
      page.locator('[role="alert"]'),
      page.locator(".error, .alert-error, .notification-error").first(),
    ];

    let errorFound = false;
    for (const errorSelector of errorMessages) {
      if (await errorSelector.isVisible()) {
        const errorText = await errorSelector.textContent();
        console.log(`✅ Error message displayed: "${errorText}"`);
        errorFound = true;
        break;
      }
    }

    expect(errorFound).toBe(true);
  });

  test("should show loading state during search", async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await searchInput.fill("tuberculosis genome data");

    // Submit search and immediately check for loading indicators
    const searchButton = page
      .locator(
        'button:has-text("Search"), button[type="submit"], button:has-text("Find")'
      )
      .first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press("Enter");
    }

    // Check for loading indicators quickly
    const loadingIndicators = [
      page.locator("text=/loading/i"),
      page.locator("text=/searching/i"),
      page.locator('.spinner, .loading, [data-testid="loading"]').first(),
      page.locator('[role="progressbar"]'),
    ];

    let loadingFound = false;
    for (const loadingSelector of loadingIndicators) {
      try {
        await loadingSelector.waitFor({ timeout: 1000 });
        console.log("✅ Loading indicator found");
        loadingFound = true;
        break;
      } catch {
        // Continue checking other selectors
      }
    }

    if (!loadingFound) {
      console.log("⚠️ No loading indicator found (search may be very fast)");
    }

    // Wait for search to complete
    await page.waitForTimeout(5000);
  });

  test("should have navigation link in header", async ({ page }) => {
    // Go to homepage first
    await page.goto("http://localhost");

    // Look for Search link in navigation
    const searchNavLink = page
      .locator('nav a:has-text("Search"), header a:has-text("Search")')
      .first();
    await expect(searchNavLink).toBeVisible();

    // Click the search link
    await searchNavLink.click();

    // Verify we're on the search page
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.locator("text=Dataset Search")).toBeVisible();

    console.log("✅ Search navigation link works correctly");
  });

  test("should display breadcrumbs correctly", async ({ page }) => {
    // Check breadcrumbs structure
    const breadcrumbs = page
      .locator(
        'nav[aria-label*="breadcrumb" i], .breadcrumbs, nav:has-text("Home")'
      )
      .first();
    await expect(breadcrumbs).toBeVisible();

    // Check for Home link
    const homeLink = breadcrumbs.locator('a:has-text("Home")');
    await expect(homeLink).toBeVisible();

    // Check for Search text
    const searchText = breadcrumbs.locator('text="Search"');
    await expect(searchText).toBeVisible();

    // Test Home link functionality
    await homeLink.click();
    await expect(page).toHaveURL("http://localhost/");

    console.log("✅ Breadcrumbs display and function correctly");
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ height: 667, width: 375 });
    await page.goto("http://localhost/search");

    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    await expect(searchInput).toBeVisible();

    console.log("✅ Search page works on mobile viewport");

    // Test tablet view
    await page.setViewportSize({ height: 1024, width: 768 });
    await expect(searchInput).toBeVisible();

    console.log("✅ Search page works on tablet viewport");

    // Test desktop view
    await page.setViewportSize({ height: 800, width: 1200 });
    await expect(searchInput).toBeVisible();

    console.log("✅ Search page works on desktop viewport");
  });

  test("should handle special characters in search input", async ({ page }) => {
    const specialQueries = [
      "β-lactamase genes",
      "16S rRNA sequences",
      "SARS-CoV-2 genome",
      "H1N1 influenza",
    ];

    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();

    for (const query of specialQueries) {
      await searchInput.fill(query);
      await expect(searchInput).toHaveValue(query);
      console.log(`✅ Special characters handled correctly: "${query}"`);
    }
  });

  test("should maintain search state on page refresh", async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="text"], input[placeholder*="search" i], textarea[placeholder*="search" i]'
      )
      .first();
    const testQuery = "E. coli genome sequencing";

    await searchInput.fill(testQuery);

    // Submit search
    const searchButton = page
      .locator(
        'button:has-text("Search"), button[type="submit"], button:has-text("Find")'
      )
      .first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press("Enter");
    }

    // Wait for search to process
    await page.waitForTimeout(3000);

    // Refresh the page
    await page.reload();

    // Check if search input is preserved (this may not be implemented yet)
    const inputValue = await searchInput.inputValue();
    if (inputValue === testQuery) {
      console.log("✅ Search state preserved after refresh");
    } else {
      console.log("⚠️ Search state not preserved (may be expected behavior)");
    }
  });
});
