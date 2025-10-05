import { test, expect } from "@playwright/test";

test.describe("BRC Analytics - API Infrastructure", () => {
  test("backend API should be healthy", async ({ request }) => {
    // Check backend health endpoint
    const response = await request.get("http://localhost:8000/api/v1/health");
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBe("healthy");
    expect(health.service).toBe("BRC Analytics API");
    console.log("Backend health:", health);
  });

  test("cache health check should work", async ({ request }) => {
    // Check cache health endpoint
    const response = await request.get(
      "http://localhost:8000/api/v1/cache/health"
    );
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBe("healthy");
    expect(health.cache).toBe("connected");
    console.log("Cache health:", health);
  });

  test("version endpoint should return version info", async ({ request }) => {
    // Check version endpoint
    const response = await request.get("http://localhost:8000/api/v1/version");
    expect(response.ok()).toBeTruthy();

    const version = await response.json();
    expect(version.version).toBeTruthy();
    expect(version.environment).toBeTruthy();
    expect(version.service).toBe("BRC Analytics API");
    console.log("API version:", version);
  });

  test("API documentation should be accessible", async ({ page }) => {
    // Navigate to API docs
    await page.goto("http://localhost:8000/api/docs");

    // Check that Swagger UI loaded
    await expect(page.locator(".swagger-ui")).toBeVisible({ timeout: 10000 });

    // Check for API title
    const title = page.locator(".title");
    await expect(title).toContainText("BRC Analytics API");

    // Screenshot the API docs
    await page.screenshot({
      fullPage: true,
      path: "tests/screenshots/api-docs.png",
    });
  });
});
