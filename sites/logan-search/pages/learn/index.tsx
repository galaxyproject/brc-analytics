import { buildStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/staticProps";
import { buildMDXFilePath } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/utils";
import { MDX_COMPONENTS } from "@logan/mdx/constants";
import { LOGAN_PAGE_META } from "@logan/meta/constants";
import { SMOKE } from "@logan/theme/options/palette";
import { LearnView } from "@logan/views/LearnView/learnView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { sanitizeFrontmatter } from "@repo/shared/views/docs/common/frontmatter/utils";
import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import { sanitizeStaticProps } from "@repo/shared/views/docs/common/staticGeneration/utils";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

// Paths resolve from the repo root, where the build scripts run next.
const DOCS_DIRS = ["sites", "logan-search", "docs"];
const SLUG = ["learn"];

const Page = (props: StaticProps): JSX.Element | null => {
  return <LearnView {...props} components={MDX_COMPONENTS} />;
};

export const getStaticProps: GetStaticProps<StaticProps> = async () => {
  const staticProps = await buildStaticProps(
    buildMDXFilePath(DOCS_DIRS, SLUG),
    SLUG,
    sanitizeFrontmatter,
    { mdxOptions: { development: process.env.NODE_ENV !== "production" } },
    {
      pageDescription: LOGAN_PAGE_META.LEARN.pageDescription,
      themeOptions: { palette: { background: { default: SMOKE.LIGHTEST } } },
    }
  );

  if (!staticProps) return { notFound: true };

  return sanitizeStaticProps(staticProps);
};

export default Page;

Page.Main = StyledPagesMain;
