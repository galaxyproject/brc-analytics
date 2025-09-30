import { JSX } from "react";
import { Fragment } from "react";
import { SectionAISearch } from "../../components/Home/components/Section/components/SectionAISearch/sectionAISearch";
import { SectionAnalytics } from "../../components/Home/components/Section/components/SectionAnalytics/sectionAnalytics";
import { SectionAssemblies } from "../../components/Home/components/Section/components/SectionAssemblies/sectionAssemblies";
import { SectionHelp } from "../../components/Home/components/Section/components/SectionHelp/sectionHelp";
import { SectionHero } from "../../components/Home/components/Section/components/SectionHero/sectionHero";
import { SectionSubHero } from "../../components/Home/components/Section/components/SectionSubHero/sectionSubHero";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      <SectionAISearch />
      <SectionAssemblies />
      <SectionAnalytics />
      <SectionHelp />
    </Fragment>
  );
};
