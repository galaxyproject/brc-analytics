import { SectionSubtitle, SectionTitle } from "../../section.styles";
import { SectionViz as Sunburst } from "../SectionViz/sunburst";
import { Headline, Section, SectionLayout } from "./sectionAssemblies.styles";

export const SectionAssemblies = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <SectionTitle>Browse Assemblies</SectionTitle>
          <SectionSubtitle>
            Browse assemblies by taxonomic lineage.
          </SectionSubtitle>
        </Headline>
        <Sunburst />
      </SectionLayout>
    </Section>
  );
};
