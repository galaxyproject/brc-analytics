import { Fragment } from "react";
import { StaticProps } from "../../docs/common/staticGeneration/types";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";

export const LearnContentView = (props: StaticProps): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={props.frontmatter.breadcrumbs || []}
        head={props.frontmatter.title}
        subHead={props.frontmatter.subtitle}
      />
      <h1>{props.frontmatter.description}</h1>
    </Fragment>
  );
};
