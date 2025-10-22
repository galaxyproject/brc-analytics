import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { MDXRemote } from "next-mdx-remote";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";
import { Content } from "../../components/Docs/components/Content/content";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";

export const LearnContentView = (props: StaticProps): JSX.Element | null => {
  const { frontmatter, mdxSource, outline, ...contentProps } = props;

  if (!mdxSource) return null;

  const { breadcrumbs, title } = frontmatter || {};

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={breadcrumbs || []}
        head={title}
        subHead={null}
      />
      <SectionContent
        content={
          <Content>
            <MDXRemote {...mdxSource} components={MDX_COMPONENTS} />
          </Content>
        }
        frontmatter={frontmatter}
        outline={<Outline outline={outline} Contents={ContentsTab} />}
        {...contentProps}
      />
    </Fragment>
  );
};
