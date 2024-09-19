import { Fragment } from "react";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { SectionRoadmap } from "../../components/Roadmap/components/Section/components/SectionRoadmap/sectionRoadmap";
import { SectionSubhero } from "../../components/Roadmap/components/Section/components/SectionSubhero/sectionSubhero";
import { BREADCRUMBS } from "./common/constants";

export const RoadmapView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Roadmap"
        subHead="As BRC Analytics develops, we will utilize existing APIs and design new approaches for external data access, integrate Galaxy with hundreds of tools, provide access to Jupyter and RStudio for ad hoc analytics, offer custom tools and ObservableHQ-based dashboards, and include interactive tutorials for users of all skill levels."
      />
      <SectionSubhero />
      <SectionRoadmap />
    </Fragment>
  );
};
