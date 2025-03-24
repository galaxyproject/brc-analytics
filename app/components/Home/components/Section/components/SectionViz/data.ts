import data from "catalog/output/ncbi-taxa-tree.json";

/**
 * Interface representing a node in the NCBI taxonomy tree
 */
export interface TreeNode {
  /**
   * Child nodes in the taxonomy tree
   */
  children: TreeNode[];

  /**
   * The name of the taxonomic entity
   */
  name: string;

  /**
   * The NCBI taxonomy ID as a string
   */
  ncbi_tax_id: string;

  /**
   * Taxonomic rank (e.g., "domain", "phylum", "class", "order", "family", "genus", "species", "strain")
   * This is optional as some nodes might not have rank specified
   */
  rank?: string;
}

export function getData(): TreeNode {
  // Any data massaging can be done at this extension point.
  return data;
}
