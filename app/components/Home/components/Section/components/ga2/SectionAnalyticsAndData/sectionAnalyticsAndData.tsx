import { SectionSubtitle, SectionTitle } from "../../../section.styles";
import { AnalyticsToolsAndData } from "./components/AnalyticsToolsAndData/analyticsToolsAndData";
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
            GenomeArk combines GenomeArk data with official genomic data from
            the NCBI Datasets and the UCSC Genome Browser, powered by the
            unlimited analytical capacity of the Galaxy Platform at the Texas
            Advanced Computing Center (TACC) and Jetstream2.
          </SectionSubtitle>
        </Headline>
        <AnalyticsToolsAndData />
      </SectionLayout>
    </Section>
  );
};
