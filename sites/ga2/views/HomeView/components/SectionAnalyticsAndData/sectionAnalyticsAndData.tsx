import { AnalyticsTools } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/analyticsTools";
import {
  SectionSubtitle,
  SectionTitle,
} from "@repo/shared/views/HomeView/components/Section/section.styles";
import { type JSX } from "react";
import { ANALYTICS_TOOLS } from "./constants";
import {
  Headline,
  Section,
  SectionLayout,
} from "./sectionAnalyticsAndData.styles";

export const SectionAnalyticsAndData = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <SectionTitle>What is GenomeArk?</SectionTitle>
          <SectionSubtitle>
            GenomeArk combines VGP Phase I data with official genomic data from
            the NCBI Datasets and the UCSC Genome Browser, powered by the
            unlimited analytical capacity of the Galaxy Platform at the Texas
            Advanced Computing Center (TACC) and Jetstream2.
          </SectionSubtitle>
        </Headline>
        <AnalyticsTools cards={ANALYTICS_TOOLS} />
      </SectionLayout>
    </Section>
  );
};
