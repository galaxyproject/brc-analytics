import { Fragment } from "react";
import { SectionBranding } from "../../components/Layout/components/AppLayout/components/Section/components/SectionBranding/sectionBranding";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const AnalyzeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Analyze"
        subHead={
          <span>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</span>
        }
      />
      <SectionBranding />
    </Fragment>
  );
};
