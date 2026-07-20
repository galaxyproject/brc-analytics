import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for GA2 (Genome Ark 2) UI smoke tests (no backend
 * required).
 *
 * The default playwright.config.ts builds and tests the BRC Analytics site.
 * This config runs the GA2-only smoke suite in tests/e2e/ga2 against a served
 * GA2 build. Locally the webServer builds GA2 first (`build-local:ga2 &&
 * start:ga2`); in CI it only runs `npm run start:ga2`, relying on the ga2-smoke-tests
 * workflow job to build GA2 beforehand. It is kept separate so the default
 * `npx playwright test` (BRC) is unaffected — the two sites are exercised by
 * independent jobs.
 *
 * Run with:
 *   npx playwright test --config=playwright.ga2.config.ts
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e/ga2",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? "npm run start:ga2"
      : "npm run build-local:ga2 && npm run start:ga2",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120 * 1000 : 600 * 1000,
    url: "http://localhost:3000",
  },
  workers: 3,
});
