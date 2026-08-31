import { SectionAnalytics } from "@brc/views/HomeView/components/SectionAnalytics/sectionAnalytics";
import { SectionAssemblies } from "@brc/views/HomeView/components/SectionAssemblies/sectionAssemblies";
import { SectionHero } from "@brc/views/HomeView/components/SectionHero/sectionHero";
import { SectionSubHero } from "@brc/views/HomeView/components/SectionSubHero/sectionSubHero";
import { SectionWhatsNew } from "@brc/views/HomeView/components/SectionWhatsNew/sectionWhatsNew";
import { SectionWhitePapers } from "@brc/views/HomeView/components/SectionWhitePapers/sectionWhitePapers";
import { Fragment, type JSX } from "react";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionWhatsNew />
      <SectionWhitePapers />
      <SectionSubHero />
      <SectionAssemblies />
      <SectionAnalytics />
    </Fragment>
  );
};
