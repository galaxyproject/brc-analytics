import { Fragment } from "react";
import { SectionHero } from "../../../components/Home/components/Section/components/ga2/SectionHero/sectionHero";
import { SectionSubHero } from "../../../components/Home/components/Section/components/ga2/SectionSubHero/sectionSubHero";
import { SectionAnalyticsAndData } from "../../../components/Home/components/Section/components/ga2/SectionAnalyticsAndData/sectionAnalyticsAndData";

export const HomeView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero />
      <SectionSubHero />
      <SectionAnalyticsAndData />
    </Fragment>
  );
};
