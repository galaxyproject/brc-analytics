import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for BRC Analytics tests
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev",
      reuseExistingServer: true,
      timeout: 120 * 1000,
      url: "http://localhost:3000",
    },
    {
      command: "docker-compose up",
      reuseExistingServer: true,
      timeout: 120 * 1000,
      url: "http://localhost:8000/api/v1/health",
    },
  ],
  workers: 1,
});
