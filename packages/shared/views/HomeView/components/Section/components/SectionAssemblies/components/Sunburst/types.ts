import { type HierarchyRectangularNode } from "d3-hierarchy";

/**
 * Interface representing a node in the NCBI taxonomy tree.
 */
export interface TaxonomyNode {
  /**
   * The number of assemblies for the taxon that are present in the catalog.
   */
  assembly_count: number;

  /**
   * Child nodes in the taxonomy tree.
   */
  children: TaxonomyNode[];

  /**
   * The name of the taxonomic entity.
   */
  name: string;

  /**
   * The NCBI taxonomy ID as a string.
   */
  ncbi_tax_id: string;

  /**
   * Taxonomic rank (e.g., "domain", "phylum", "class", "order", "family",
   * "genus", "species", "strain", "serotype", "isolate"). Optional as some
   * nodes might not have a rank specified.
   */
  rank?: string;
}

/**
 * Angular (x) and radial (y) extent of an arc, in radians and rings.
 */
export interface ArcCoords {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * A partitioned taxonomy node, plus where its arc is drawn right now
 * (`current`) and where it is headed in the running zoom (`target`).
 */
export type TreeNode = HierarchyRectangularNode<TaxonomyNode> & {
  current: ArcCoords;
  target: ArcCoords;
};
