import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { MDXRemote } from "next-mdx-remote";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";
import { Content } from "../../components/Docs/components/Content/content";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";

export const LearnContentView = (props: StaticProps): JSX.Element => {
  const { frontmatter, mdxSource, outline, ...contentProps } = props;
  const { enableOutline } = frontmatter;
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={frontmatter.breadcrumbs || []}
        head={frontmatter.title}
        subHead={frontmatter.subtitle}
      />
      <SectionContent
        content={
          <Content>
            <MDXRemote {...mdxSource} components={MDX_COMPONENTS} />
          </Content>
        }
        frontmatter={frontmatter}
        outline={enableOutline ? renderOutline(outline) : undefined}
        {...contentProps}
      />
    </Fragment>
  );
};

/**
 * Renders page outline.
 * @param outline - Outline items.
 * @returns outline.
 */
function renderOutline(
  outline?: OutlineItem[] | null
): JSX.Element | undefined {
  if (!outline) return;
  if (outline.length === 0) return;
  return <Outline outline={outline} Contents={ContentsTab} />;
}
