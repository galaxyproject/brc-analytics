import { Sunburst } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/sunburst";
import { type TaxonomyNode } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/types";
import {
  SectionSubtitle,
  SectionTitle,
} from "@repo/shared/views/HomeView/components/Section/section.styles";
import taxaTree from "catalog/ga2/output/ncbi-taxa-tree.json";
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
        <Sunburst
          data={taxaTree as TaxonomyNode}
          logoPath="/logo/genomeark2.svg"
          startingNode="Metazoa"
        />
      </SectionLayout>
    </Section>
  );
};
