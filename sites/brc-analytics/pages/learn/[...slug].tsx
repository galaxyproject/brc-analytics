import { LearnContentView } from "@brc/views/LearnContentView/learnContentView";
import { buildStaticPaths } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticPaths";
import { buildStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticProps";
import {
  buildMDXFilePath,
  buildMDXSlug,
} from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/utils";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { sanitizeFrontmatter } from "@repo/shared/views/docs/common/frontmatter/utils";
import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import { sanitizeStaticProps } from "@repo/shared/views/docs/common/staticGeneration/utils";
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
  // Build the slug.
  const slug = buildMDXSlug(props, LEARN_DIR);

  // Build the static props for the page.
  const staticProps = await buildStaticProps(
    buildMDXFilePath(DOCS_DIRS, slug),
    slug,
    sanitizeFrontmatter,
    { mdxOptions: { development: process.env.NODE_ENV !== "production" } },
    { themeOptions: { palette: { background: { default: SMOKE_LIGHTEST } } } }
  );

  // If the static props are not found, return not found.
  if (!staticProps) return { notFound: true };

  // Return the static props.
  return sanitizeStaticProps(staticProps);
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    fallback: false,
    paths: buildStaticPaths([...DOCS_DIRS, LEARN_DIR]),
  };
};

export default Page;

Page.Main = StyledPagesMain;
