import { JSX } from "react";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { LearnContentView } from "../../app/views/LearnContentView/learnContentView";
import { buildStaticPaths } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticPaths";
import { buildStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticProps";
import { sanitizeStaticProps } from "../../app/docs/common/staticGeneration/utils";
import { StaticProps } from "../../app/docs/common/staticGeneration/types";
import { sanitizeFrontmatter } from "../../app/docs/common/frontmatter/utils";
import {
  buildMDXFilePath,
  buildMDXSlug,
} from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/utils";

const APPS_DIR = "app";
const DOCS_DIR = "docs";
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
    buildMDXFilePath([APPS_DIR, DOCS_DIR], slug),
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
  return {
    fallback: false,
    paths: buildStaticPaths([APPS_DIR, DOCS_DIR, LEARN_DIR]),
  };
};

export default Page;

Page.Main = StyledPagesMain;
