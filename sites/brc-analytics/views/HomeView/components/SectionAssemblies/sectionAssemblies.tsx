import { Sunburst } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/sunburst";
import { type TaxonomyNode } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/types";
import {
  SectionSubtitle,
  SectionTitle,
} from "@repo/shared/views/HomeView/components/Section/section.styles";
import { type JSX } from "react";
import { Headline, Section, SectionLayout } from "./sectionAssemblies.styles";

/**
 * Loads the catalog's taxonomy tree as its own chunk.
 * @returns The taxonomy tree.
 */
const loadTaxaTree = (): Promise<TaxonomyNode> =>
  import("@catalog/output/ncbi-taxa-tree.json").then(
    (module) => module.default as TaxonomyNode
  );

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
        <Sunburst loadData={loadTaxaTree} logoPath="/logo/brc.svg" />
      </SectionLayout>
    </Section>
  );
};
