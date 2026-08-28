import { type JSX } from "react";
import { AssistantPrompt } from "./components/AssistantPrompt/assistantPrompt";
import {
  Head,
  Headline,
  HeroImageLeft,
  HeroImageRight,
  SectionLayout,
  StyledSection,
  Subhead,
} from "./sectionHero.styles";

export const SectionHero = (): JSX.Element => {
  return (
    <StyledSection>
      <HeroImageLeft />
      <HeroImageRight />
      <SectionLayout>
        <Headline>
          <Head>AI-powered analytics for pathogen, host, and vector data</Head>
          <Subhead>
            Ask our AI assistant anything about genomic data. Get instant
            insights into disease-causing organisms through natural conversation
          </Subhead>
        </Headline>
        <AssistantPrompt />
      </SectionLayout>
    </StyledSection>
  );
};
