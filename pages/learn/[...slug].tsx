import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { config } from "@/config/config";
import { sanitizeFrontmatter } from "@/docs/common/frontmatter/utils";
import { sanitizeStaticProps } from "@/docs/common/staticGeneration/utils";
import { LearnContentView } from "@brc/views/LearnContentView/learnContentView";
import { buildStaticPaths } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticPaths";
import { buildStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticProps";
import {
  buildMDXFilePath,
  buildMDXSlug,
} from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/utils";
import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import { ROUTES } from "@routes/constants";
import {
  type GetStaticPaths,
  type GetStaticProps,
  type GetStaticPropsContext,
} from "next";
import { type JSX } from "react";

const DOCS_DIRS = ["sites", "brc-analytics", "docs"];
const LEARN_DIR = "learn";

const Page = (props: StaticProps): JSX.Element => {
  return <LearnContentView {...props} />;
};

export const getStaticProps: GetStaticProps<StaticProps> = async (
  props: GetStaticPropsContext
) => {
  const { allowedPaths } = config();

  // Only build on sites where /learn is an allowed path.
  if (allowedPaths && !allowedPaths.includes(ROUTES.LEARN)) {
    return { notFound: true };
  }

  // Build the slug.
  const slug = buildMDXSlug(props, LEARN_DIR);

  // Build the static props for the page.
  const staticProps = await buildStaticProps(
    buildMDXFilePath(DOCS_DIRS, slug),
    slug,
    sanitizeFrontmatter,
    { mdxOptions: { development: process.env.NODE_ENV !== "production" } },
    { themeOptions: { palette: { background: { default: "#FAFBFB" } } } }
  );

  // If the static props are not found, return not found.
  if (!staticProps) return { notFound: true };

  // Return the static props.
  return sanitizeStaticProps(staticProps);
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { allowedPaths } = config();

  // Generate no paths on sites where /learn is not an allowed path.
  if (allowedPaths && !allowedPaths.includes(ROUTES.LEARN)) {
    return { fallback: false, paths: [] };
  }

  return {
    fallback: false,
    paths: buildStaticPaths([...DOCS_DIRS, LEARN_DIR]),
  };
};

export default Page;

Page.Main = StyledPagesMain;
