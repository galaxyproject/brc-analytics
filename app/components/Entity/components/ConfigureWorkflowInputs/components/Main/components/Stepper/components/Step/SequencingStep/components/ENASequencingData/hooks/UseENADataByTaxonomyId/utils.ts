import { MAX_READ_RUNS_FOR_BROWSE_ALL } from "./constants";
import taxonomyReadCounts from "./taxonomy_read_counts.json";

/**
 * Determines whether ENA data should be pre-fetched by taxonomy ID.
 * Pre-fetching occurs when the read count is less than the maximum allowable count.
 * A 0 read count is not a valid value and should not be pre-fetched; the user will only be able to browse data by accession.
 * @param taxonomyId - Taxonomy ID.
 * @returns True if ENA data by taxonomy ID should be pre-fetched.
 */
export function shouldFetch(taxonomyId: string): boolean {
  if (!taxonomyId) return false;

  const taxonomyIdReadCounts = new Map(Object.entries(taxonomyReadCounts));
  const readCount = taxonomyIdReadCounts.get(taxonomyId);

  // If the read count is not found -- or is 0, we should not pre-fetch ENA data by taxonomy ID.
  if (!readCount) return false;

  return readCount < MAX_READ_RUNS_FOR_BROWSE_ALL;
}
