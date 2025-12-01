import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for API integration tests.
 * Requires Docker backend to be running.
 *
 * Run with: npx playwright test --config=playwright.api.config.ts
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  projects: [
    {
      name: "api",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e/api",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      url: "http://localhost:3000",
    },
    {
      command: "docker compose -f backend/docker-compose.yml up",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      url: "http://localhost:8000/api/v1/health",
    },
  ],
  workers: 1,
});
