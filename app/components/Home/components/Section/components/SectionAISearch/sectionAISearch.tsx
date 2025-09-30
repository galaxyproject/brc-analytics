import { SectionSubtitle, SectionTitle } from "../../section.styles";
import { NaturalLanguageSearch } from "../../../../../LLMSearch";
import { Section, SectionLayout, Headline } from "./sectionAISearch.styles";

export const SectionAISearch = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <SectionTitle>AI-Powered Dataset Discovery</SectionTitle>
          <SectionSubtitle>
            Use natural language to find sequencing datasets. Describe what
            you&apos;re looking for and our AI will help interpret your query
            and find relevant data.
          </SectionSubtitle>
        </Headline>
        <NaturalLanguageSearch />
      </SectionLayout>
    </Section>
  );
};
