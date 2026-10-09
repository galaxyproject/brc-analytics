import nextMDX from "@next/mdx";

const withMDX = nextMDX({
  extension: /\.mdx?$/,
});

const nextConfig = {
  // Stop `next dev` writing an AGENTS.md into the site when it detects an AI agent.
  agentRules: false,
  basePath: "",
  compiler: { emotion: true },
  images: { unoptimized: true },
  output: "export",
  pageExtensions: ["md", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  transpilePackages: ["@databiosphere/findable-ui"],
};

export default withMDX(nextConfig);
