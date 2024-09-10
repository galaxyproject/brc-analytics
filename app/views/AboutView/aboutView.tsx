import { Fragment } from "react";
import { SectionWhatToExpect } from "../../components/About/components/Section/components/SectionWhatToExpect/sectionWhatToExpect";
import { SectionBranding } from "../../components/Layout/components/AppLayout/components/Section/components/SectionBranding/sectionBranding";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const AboutView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Discover Our Story"
        subHead="BRC-analytics is an analysis platform that has two goals. First, to serve genomic data and associated annotations for pathogens and their vectors. Second, to allow anyone to analyze pathogen and vector data using free public computational infrastructure."
      />
      <SectionWhatToExpect />
      <SectionBranding />
    </Fragment>
  );
};