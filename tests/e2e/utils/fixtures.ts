import { test as base } from "@playwright/test";

/**
 * Global fixture to mock analytics requests.
 * @see https://playwright.dev/docs/test-fixtures
 * To use: import { expect, test } from "../utils/fixtures";
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
