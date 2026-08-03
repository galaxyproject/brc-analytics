import { SectionAnalytics } from "@/components/Home/components/Section/components/SectionAnalytics/sectionAnalytics";
import { SectionAssemblies } from "@/components/Home/components/Section/components/SectionAssemblies/sectionAssemblies";
import { SectionWhitePapers } from "@/components/Home/components/Section/components/SectionWhitePapers/sectionWhitePapers";
import { SectionHero } from "@brc/views/HomeView/components/SectionHero/sectionHero";
import { SectionSubHero } from "@brc/views/HomeView/components/SectionSubHero/sectionSubHero";
import { Fragment, type JSX } from "react";

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
