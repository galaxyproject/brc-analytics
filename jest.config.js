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
  // the other sites' aliases for site isolation); the central test suite spans
  // every site, so map those explicitly here.
  moduleNameMapper: {
    // d3's packages ship as ESM, which Jest won't load from node_modules;
    // each also ships a UMD build that it will.
    "^(d3-[a-z]+)$": "<rootDir>/node_modules/$1/dist/$1.js",
    "^@ga2/(.*)$": "<rootDir>/sites/ga2/$1",
    "^@logan/(.*)$": "<rootDir>/sites/logan-search/$1",
  },
  setupFiles: ["<rootDir>/tests/setup/environment.ts"],
  testEnvironment: "jest-environment-jsdom",
  // Excludes Playwright e2e tests which Jest cannot parse
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/catalog/",
    "/tests/e2e/",
  ],
};

module.exports = createJestConfig(customJestConfig);
