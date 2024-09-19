import { Fragment } from "react";
import { SectionAnalytics } from "../../components/Home/components/Section/components/SectionAnalytics/sectionAnalytics";
import { SectionHelp } from "../../components/Home/components/Section/components/SectionHelp/sectionHelp";
import { SectionHero } from "../../components/Home/components/Section/components/SectionHero/sectionHero";
import { SectionSubHero } from "../../components/Home/components/Section/components/SectionSubHero/sectionSubHero";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      <SectionAnalytics />
      <SectionHelp />
    </Fragment>
  );
};
