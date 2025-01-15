import { Fragment } from "react";
import { SectionRoadmap } from "../../components/content";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const RoadmapView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Roadmap"
        subHead="BRC Analytics plans to deliver new powerful analysis functionality while provide access to some features of the VEuPathDb system. This will be an iterative process involving multiple steps in several areas."
      />
      <SectionRoadmap />
    </Fragment>
  );
};
