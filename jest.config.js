// eslint-disable-next-line @typescript-eslint/no-require-imports -- Required for Jest setup
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  // Excludes Playwright e2e tests which Jest cannot parse
  testPathIgnorePatterns: ["/node_modules/", "/catalog/", "/tests/e2e/"],
};

module.exports = createJestConfig(customJestConfig);
