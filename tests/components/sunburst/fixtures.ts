import { type TaxonomyNode } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/types";

/**
 * A taxon with the given children.
 * @param name - Taxon name.
 * @param children - Child taxa.
 * @param rank - Taxonomic rank.
 * @returns A taxonomy node.
 */
export function taxon(
  name: string,
  children: TaxonomyNode[] = [],
  rank = "species"
): TaxonomyNode {
  return {
    assembly_count: Math.max(1, children.length),
    children,
    name,
    ncbi_tax_id: name,
    rank,
  };
}

/**
 * A chain of single-child taxa, `length` deep below `name`.
 * @param name - Name prefix.
 * @param length - Levels below the top node.
 * @returns The top of the chain.
 */
export function chain(name: string, length: number): TaxonomyNode {
  let node = taxon(`${name}-${length}`);
  for (let level = length - 1; level >= 0; level--) {
    node = taxon(`${name}-${level}`, [node], "genus");
  }
  return node;
}

/**
 * Root with three domains, each six levels deep -- deeper than the four
 * rings the chart shows, so there is always something off screen.
 * @returns The taxonomy tree.
 */
export function sampleTree(): TaxonomyNode {
  return taxon(
    "root",
    [
      taxon("Alpha", [chain("a", 5), chain("b", 5)], "domain"),
      taxon("Beta", [chain("c", 5)], "domain"),
      taxon("Gamma", [chain("d", 5)], "domain"),
    ],
    "no rank"
  );
}
