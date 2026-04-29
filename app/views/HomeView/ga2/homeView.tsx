import { Fragment, JSX } from "react";
import { SectionAnalyticsAndData } from "../../../components/Home/components/Section/components/ga2/SectionAnalyticsAndData/sectionAnalyticsAndData";
import { SectionAssemblies } from "../../../components/Home/components/Section/components/ga2/SectionAssemblies/sectionAssemblies";
import { SectionHero } from "../../../components/Home/components/Section/components/ga2/SectionHero/sectionHero";
import { SectionSubHero } from "../../../components/Home/components/Section/components/ga2/SectionSubHero/sectionSubHero";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      <SectionAssemblies />
      <SectionAnalyticsAndData />
    </Fragment>
  );
};
