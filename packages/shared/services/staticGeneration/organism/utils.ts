import type { OrganismContract } from "@repo/shared/apis/types";

/**
 * Cuts each of an organism's genomes down to its lineage taxonomy IDs, the
 * only genome field the workflow-compatibility check reads, for pages that
 * embed the organism record but never render its genomes. A full genome record
 * is roughly forty fields, so an organism with many assemblies would otherwise
 * embed hundreds of kilobytes it doesn't use.
 * @param organism - Organism record.
 * @returns The organism, with each genome reduced to its lineage taxonomy IDs.
 */
export async function slimOrganismGenomes(
  organism: OrganismContract
): Promise<OrganismContract> {
  if (!organism.genomes) return organism;
  return {
    ...organism,
    genomes: organism.genomes.map(({ lineageTaxonomyIds }) => ({
      lineageTaxonomyIds,
    })),
  };
}
