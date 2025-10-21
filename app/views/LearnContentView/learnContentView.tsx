import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { MDXRemote } from "next-mdx-remote";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";
import {
  Section,
  SectionLayout,
} from "../../components/content/content.styles";
import { StyledSectionContent } from "../../components/Docs/components/Content/content.styles";

export const LearnContentView = (props: StaticProps): JSX.Element => {
  const { frontmatter, mdxSource } = props;
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={frontmatter.breadcrumbs || []}
        head={frontmatter.title}
        subHead={frontmatter.subtitle}
      />
      <Section border>
        <SectionLayout>
          <StyledSectionContent>
            <MDXRemote {...mdxSource} components={MDX_COMPONENTS} />
          </StyledSectionContent>
        </SectionLayout>
      </Section>
    </Fragment>
  );
};
