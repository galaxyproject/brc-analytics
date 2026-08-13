// eslint-disable-next-line @typescript-eslint/no-require-imports -- Required for Jest setup
const nextJest = require("next/jest");

// Point at a site app so next/jest picks up its next.config (SWC transform +
// transpilePackages) and env; the root no longer has a Next app.
const createJestConfig = nextJest({
  dir: "./sites/brc-analytics",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  // next/jest derives aliases from the brc-analytics tsconfig (which omits
  // @ga2 for site isolation); the central test suite spans both sites, so map
  // @ga2 explicitly here.
  moduleNameMapper: {
    "^@ga2/(.*)$": "<rootDir>/sites/ga2/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  // Excludes Playwright e2e tests which Jest cannot parse
  testPathIgnorePatterns: ["/node_modules/", "/catalog/", "/tests/e2e/"],
};

module.exports = createJestConfig(customJestConfig);
