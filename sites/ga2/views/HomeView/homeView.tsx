import { SectionAnalyticsAndData } from "@/components/Home/components/Section/components/ga2/SectionAnalyticsAndData/sectionAnalyticsAndData";
import { SectionHero } from "@/components/Home/components/Section/components/ga2/SectionHero/sectionHero";
import { SectionSubHero } from "@/components/Home/components/Section/components/ga2/SectionSubHero/sectionSubHero";
import { Fragment, JSX } from "react";
import { SectionAssemblies } from "./components/SectionAssemblies/sectionAssemblies";

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
