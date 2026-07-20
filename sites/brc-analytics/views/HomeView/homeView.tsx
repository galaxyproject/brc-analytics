import { SectionAnalytics } from "@/components/Home/components/Section/components/SectionAnalytics/sectionAnalytics";
import { SectionHero } from "@/components/Home/components/Section/components/SectionHero/sectionHero";
import { SectionSubHero } from "@/components/Home/components/Section/components/SectionSubHero/sectionSubHero";
import { Fragment, JSX } from "react";
import { SectionAssemblies } from "./components/SectionAssemblies/sectionAssemblies";
import { SectionWhitePapers } from "./components/SectionWhitePapers/sectionWhitePapers";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionWhitePapers />
      <SectionSubHero />
      <SectionAssemblies />
      <SectionAnalytics />
    </Fragment>
  );
};
