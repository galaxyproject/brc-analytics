import { SectionAssemblies } from "@/components/Home/components/Section/components/SectionAssemblies/sectionAssemblies";
import { SectionAnalytics } from "@brc/views/HomeView/components/SectionAnalytics/sectionAnalytics";
import { SectionHero } from "@brc/views/HomeView/components/SectionHero/sectionHero";
import { SectionSubHero } from "@brc/views/HomeView/components/SectionSubHero/sectionSubHero";
import { SectionWhitePapers } from "@brc/views/HomeView/components/SectionWhitePapers/sectionWhitePapers";
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
