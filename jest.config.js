// eslint-disable-next-line @typescript-eslint/no-require-imports -- Required for Jest setup
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  // Resolve the @brc-analytics/core workspace package to its source. next/jest
  // resolves this for imports via tsconfig paths, but jest.mock() needs an
  // explicit mapper to resolve the same specifiers.
  moduleNameMapper: {
    "^@brc-analytics/core$": "<rootDir>/packages/core/src/index.ts",
    "^@brc-analytics/core/(.*)$": "<rootDir>/packages/core/src/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  // Excludes Playwright e2e tests which Jest cannot parse
  testPathIgnorePatterns: ["/node_modules/", "/catalog/", "/tests/e2e/"],
};

module.exports = createJestConfig(customJestConfig);
