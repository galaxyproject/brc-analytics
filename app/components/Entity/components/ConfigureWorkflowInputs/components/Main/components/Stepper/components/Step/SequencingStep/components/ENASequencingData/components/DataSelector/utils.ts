import { MAX_READ_RUNS_FOR_BROWSE_ALL } from "./constants";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import taxonomyReadCounts from "./data/taxonomy_read_counts.json";

/**
 * Determine whether the "Browse All" button should be displayed.
 * @param readCount - Read count.
 * @returns True if the "Browse All" button should be displayed, false otherwise.
 */
export function canBrowseAll(readCount: number): boolean {
  return readCount < MAX_READ_RUNS_FOR_BROWSE_ALL;
}

/**
 * Get the read count for the given genome.
 * @param genome - Genome.
 * @returns Read count.
 */
export function getReadCount(genome: BRCDataCatalogGenome): number {
  const taxonomyIdReadCounts = new Map(Object.entries(taxonomyReadCounts));
  const readCount = taxonomyIdReadCounts.get(genome.ncbiTaxonomyId);

  if (!readCount) return MAX_READ_RUNS_FOR_BROWSE_ALL;

  return readCount;
}
