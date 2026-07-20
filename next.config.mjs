// This root Next config is no longer built — the apps live in sites/*. It is
// kept solely because next/jest (jest.config.js, dir: "./") reads it to set up
// the SWC transform for unit tests. Keep it minimal and site-neutral: only the
// options that affect how test files are transformed (emotion's css prop +
// transpiling the ESM findable-ui package). Real build config lives per-site
// in sites/<site>/next.config.mjs.
const nextConfig = {
  compiler: { emotion: true },
  transpilePackages: ["@databiosphere/findable-ui"],
};

export default nextConfig;
