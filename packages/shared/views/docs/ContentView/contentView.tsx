import { ContentsTab } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/components/ContentsTab/contentsTab";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/outline";
import { Content } from "@repo/shared/views/docs/components/Content/content";
import { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import { HeroImage } from "@repo/shared/views/docs/components/SectionHero/components/HeroImage/heroImage";
import { StyledSectionHero } from "@repo/shared/views/docs/components/SectionHero/sectionHero.styles";
import { MDXRemote } from "next-mdx-remote";
import { Fragment, type JSX } from "react";
import type { Props } from "./types";

export const ContentView = ({
  components,
  ...props
}: Props): JSX.Element | null => {
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
              <MDXRemote {...mdxSource} components={components} />
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
