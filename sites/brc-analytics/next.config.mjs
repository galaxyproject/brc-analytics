import nextMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

const nextConfig = {
  basePath: "",
  compiler: { emotion: true },
  images: {
    unoptimized: true,
  },
  output: "export",
  pageExtensions: ["md", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  transpilePackages: ["@databiosphere/findable-ui"],
};

// Sentry is DSN-gated in instrumentation-client.ts (enabled only when
// NEXT_PUBLIC_SENTRY_DSN is set — i.e. BRC prod). sourcemaps are disabled, so
// no Sentry auth token is needed at build.
export default withSentryConfig(withMDX(nextConfig), {
  disableLogger: true,
  org: "galaxy",
  project: "brc-analytics-dev",
  sentryUrl: "https://sentry.galaxyproject.org/",
  silent: true,
  sourcemaps: {
    disable: true,
  },
  suppressGlobalErrorHandlerFileWarning: true,
});
