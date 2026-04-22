import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { MDXRemote } from "next-mdx-remote";
import { Fragment, JSX } from "react";
import { Content } from "../../components/Docs/components/Content/content";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";
import { HeroImage } from "../../components/Docs/components/SectionHero/components/HeroImage/heroImage";
import { StyledSectionHero } from "../../components/Docs/components/SectionHero/sectionHero.styles";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";
import { StaticProps } from "../../docs/common/staticGeneration/types";

export const LearnContentView = (props: StaticProps): JSX.Element | null => {
  const { frontmatter, mdxSource, outline, ...contentProps } = props;

  if (!mdxSource) return null;

  const { breadcrumbs, contentType, heroImage, title } = frontmatter || {};

  return (
    <Fragment>
      <StyledSectionHero
        breadcrumbs={breadcrumbs || []}
        contentType={contentType}
        head={title}
        subHead={null}
      />
      <SectionContent
        content={
          <Fragment>
            <HeroImage heroImage={heroImage} />
            <Content>
              <MDXRemote {...mdxSource} components={MDX_COMPONENTS} />
            </Content>
          </Fragment>
        }
        frontmatter={frontmatter}
        outline={
          outline && <Outline outline={outline} Contents={ContentsTab} />
        }
        {...contentProps}
      />
    </Fragment>
  );
};
