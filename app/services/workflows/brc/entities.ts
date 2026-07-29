import type { Pangenome } from "@/apis/catalog/brc-analytics-catalog/common/pangenome";
import { findEntity } from "@repo/shared/services/workflows/query";

/**
 * Gets the pangenome bundle for a species, or undefined when the species has no
 * pangenome.
 * @param speciesTaxonomyId - Species taxonomy ID.
 * @returns Pangenome bundle, or undefined.
 */
export function getPangenome(speciesTaxonomyId: string): Pangenome | undefined {
  return findEntity<Pangenome>("pangenomes", speciesTaxonomyId);
}
