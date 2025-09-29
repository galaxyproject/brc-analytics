import { config } from "../../../../../../../app/config/config";

/**
 * Interface representing a node in the NCBI taxonomy tree
 */
export interface TaxonomyNode {
  /**
   * The number of assemblies for the taxon that are present in the catalog
   */
  assembly_count: number;

  /**
   * Child nodes in the taxonomy tree
   */
  children: TaxonomyNode[];

  /**
   * The name of the taxonomic entity
   */
  name: string;

  /**
   * The NCBI taxonomy ID as a string
   */
  ncbi_tax_id: string;

  /**
   * Taxonomic rank (e.g., "domain", "phylum", "class", "order", "family", "genus", "species", "strain", "serotype", "isolate")
   * This is optional as some nodes might not have rank specified
   */
  rank?: string;
}

export function getData(): TaxonomyNode {
  const { taxTree } = config();
  if (!taxTree) {
    return {
      assembly_count: 0,
      children: [],
      name: "root",
      ncbi_tax_id: "",
    };
  }

  return taxTree;
}
