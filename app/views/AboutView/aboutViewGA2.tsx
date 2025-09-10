import { Fragment } from "react";
import { SectionAboutGA2 } from "../../components/content";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const AboutViewGA2 = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="About GenomeArk2"
        subHead="GenomeArk is a collaborative effort of four mature software and infrastructure projects that have been sustained for decades."
      />
      <SectionAboutGA2 />
    </Fragment>
  );
};
