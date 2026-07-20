import {
  SectionSubtitle,
  SectionTitle,
} from "@/components/Home/components/Section/section.styles";
import { AnalyticsTools } from "@brc-analytics/core/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/analyticsTools";
import { JSX } from "react";
import { ANALYTICS_TOOLS } from "./components/AnalyticsTools/common/constants";
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
        <AnalyticsTools cards={ANALYTICS_TOOLS} />
      </SectionLayout>
    </Section>
  );
};
