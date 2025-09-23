import { Fragment } from "react";
import { SectionHero } from "../../../components/Home/components/Section/components/ga2/SectionHero/sectionHero";
import { SectionAssemblies } from "../../../components/Home/components/Section/components/ga2/SectionAssemblies/sectionAssemblies";
import { SectionSubHero } from "../../../components/Home/components/Section/components/ga2/SectionSubHero/sectionSubHero";
import { SectionAnalyticsAndData } from "../../../components/Home/components/Section/components/ga2/SectionAnalyticsAndData/sectionAnalyticsAndData";
import { SectionHelp } from "../../../components/Home/components/Section/components/ga2/SectionHelp/sectionHelp";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      <SectionAssemblies />
      <SectionAnalyticsAndData />
      <SectionHelp />
    </Fragment>
  );
};
