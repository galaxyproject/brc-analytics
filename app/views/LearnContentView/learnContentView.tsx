import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { MDXRemote } from "next-mdx-remote";
import { MDX_COMPONENTS } from "../../docs/common/mdx/constants";

export const LearnContentView = (props: StaticProps): JSX.Element => {
  const { frontmatter, mdxSource } = props;
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={frontmatter.breadcrumbs || []}
        head={frontmatter.title}
        subHead={frontmatter.subtitle}
      />
      <MDXRemote {...mdxSource} components={MDX_COMPONENTS} />
    </Fragment>
  );
};
