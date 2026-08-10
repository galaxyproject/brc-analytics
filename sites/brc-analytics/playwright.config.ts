import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Site build/serve scripts (build-local:brc, start:brc) and the static export
// paths they use are relative to the repo root, so the webServer runs there.
const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Playwright configuration for the BRC Analytics UI tests (no backend required).
 *
 * The suite lives beside the site under sites/brc-analytics/tests/e2e and runs
 * against a served production export. Locally the webServer builds the site
 * first (`build-local:brc && start:brc`); in CI it only runs `npm run start:brc`,
 * relying on the checks workflow to build the site beforehand.
 *
 * For API tests that require the backend, use playwright.api.config.ts.
 *
 * Run with:
 *   npm run test:e2e:brc
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: [
    ["html", { outputFolder: path.resolve(__dirname, "playwright-report") }],
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? "npm run start:brc"
      : "npm run build-local:brc && npm run start:brc",
    cwd: REPO_ROOT,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120 * 1000 : 600 * 1000,
    url: "http://localhost:3000",
  },
  workers: 3,
});
