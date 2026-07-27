import { Fragment, JSX } from "react";
import { GalaxyJob } from "../../components/GalaxyJob/galaxyJob";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { TestContainer, TestSection } from "./galaxyJobView.styles";

const BREADCRUMBS = [
  { path: "/", text: "Home" },
  { path: "/galaxy-test", text: "Galaxy Integration Test" },
];

export const GalaxyJobView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Galaxy Integration Test"
        subHead="Test the Galaxy Jobs API integration by submitting data and tracking job execution"
      />
      <TestSection>
        <TestContainer>
          <GalaxyJob />
        </TestContainer>
      </TestSection>
    </Fragment>
  );
};
