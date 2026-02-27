import { withSentryConfig } from "@sentry/nextjs";
import nextMDX from "@next/mdx";
import withPlugins from "next-compose-plugins";

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

const nextConfig = withPlugins(
  [[withMDX, { pageExtensions: ["md", "mdx", "ts", "tsx"] }]],
  {
    basePath: "",
    // distDir: "out/data",
    compiler: { emotion: true },
    images: {
      unoptimized: true,
    },
    output: "export",
    reactStrictMode: true,
    transpilePackages: ["@databiosphere/findable-ui"],
  }
);

export default withSentryConfig(nextConfig, {
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
