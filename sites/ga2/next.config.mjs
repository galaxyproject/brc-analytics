import nextMDX from "@next/mdx";

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

// TODO(#1418): per-site Sentry (withSentryConfig + project name) is wired up in the
// deploy ticket; kept out of the transitional scaffold to avoid needing Sentry env here.
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

export default withMDX(nextConfig);
