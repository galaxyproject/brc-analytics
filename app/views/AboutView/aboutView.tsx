import { JSX } from "react";
import { Fragment } from "react";
import { SectionAbout } from "../../components/content";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const AboutView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="About BRC Analytics"
        subHead="BRC Analytics is a collaborative effort of four mature software and infrastructure projects that have been sustained for decades."
      />
      <SectionAbout />
    </Fragment>
  );
};
