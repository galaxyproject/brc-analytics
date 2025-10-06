// Jest was configured in 74d3967f (Sept 2024) but no Jest tests were ever written.
// This config excludes Playwright e2e tests which Jest cannot parse.
module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
};
