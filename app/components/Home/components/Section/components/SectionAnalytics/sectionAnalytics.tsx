import { JSX } from "react";
import { SectionSubtitle, SectionTitle } from "../../section.styles";
import { AnalyticsTools } from "./components/AnalyticsTools/analyticsTools";
import { Headline, Section, SectionLayout } from "./sectionAnalytics.styles";

export const SectionAnalytics = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <SectionTitle>What is BRC Analytics?</SectionTitle>
          <SectionSubtitle>
            BRC Analytics pairs official genomic data provided by the NCBI
            Datasets and UCSC Genome Browser with unlimited analytical capacity
            of Galaxy Platform powered by the Texas Advanced Computing Center
            (TACC).
          </SectionSubtitle>
        </Headline>
        <AnalyticsTools />
      </SectionLayout>
    </Section>
  );
};
