import { SectionAnalyticsAndData } from "@ga2/views/HomeView/components/SectionAnalyticsAndData/sectionAnalyticsAndData";
import { SectionAssemblies } from "@ga2/views/HomeView/components/SectionAssemblies/sectionAssemblies";
import { SectionHero } from "@ga2/views/HomeView/components/SectionHero/sectionHero";
import { SectionSubHero } from "@ga2/views/HomeView/components/SectionSubHero/sectionSubHero";
import { Fragment, type JSX } from "react";

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
