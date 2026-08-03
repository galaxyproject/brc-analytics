import { SectionAssemblies } from "@/components/Home/components/Section/components/ga2/SectionAssemblies/sectionAssemblies";
import { SectionHero } from "@/components/Home/components/Section/components/ga2/SectionHero/sectionHero";
import { SectionAnalyticsAndData } from "@ga2/views/HomeView/components/SectionAnalyticsAndData/sectionAnalyticsAndData";
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
