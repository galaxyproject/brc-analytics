import { test as base } from "@playwright/test";

/**
 * Global Playwright fixture that mocks analytics requests so tests don't wait
 * on a slow analytics TLS handshake. Re-exported by each site's e2e
 * `utils/fixtures`.
 * @see https://playwright.dev/docs/test-fixtures
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(
      "**//*plausible.galaxyproject.eu/**",
      (route) => route.fulfill({ status: 204 }) // fulfill analytics requests to avoid slow TLS handshake
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks -- use is Playwright's fixture API, not React's hook
    await use(context);
  },
});

export const expect = base.expect;
