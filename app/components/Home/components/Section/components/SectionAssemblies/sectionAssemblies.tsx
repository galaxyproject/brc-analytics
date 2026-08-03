import { SectionViz as Sunburst } from "@/components/Home/components/Section/components/SectionViz/sunburst";
import {
  SectionSubtitle,
  SectionTitle,
} from "@repo/shared/views/HomeView/components/Section/section.styles";
import { type JSX } from "react";
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
