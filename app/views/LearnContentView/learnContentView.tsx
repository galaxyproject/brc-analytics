import { JSX } from "react";
import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { MDXRemote } from "next-mdx-remote";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";
import { Content } from "../../components/Docs/components/Content/content";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";
import { StyledSectionHero } from "../../components/Docs/components/SectionHero/sectionHero.styles";
import { HeroImage } from "../../components/Docs/components/SectionHero/components/HeroImage/heroImage";

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
