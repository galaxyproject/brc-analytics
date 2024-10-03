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
            BRC Analytics consists of three components spread over four
            resources: public computational infrastructure (TACC), authoritative
            data repositories and browsers (NCBI and UCSC) and an analytical
            platform (Galaxy).
          </SectionSubtitle>
        </Headline>
        <AnalyticsTools />
      </SectionLayout>
    </Section>
  );
};
