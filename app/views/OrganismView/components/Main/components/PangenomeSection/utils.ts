/**
 * Builds the pangenome track-type labels shown in the section description.
 * Presentational copy for the current Plasmodium vivax mock; the member count
 * drives the multi-z "N-way" label.
 * @param memberCount - Number of member assemblies in the bundle.
 * @returns Track-type labels.
 */
export function getTrackTypes(memberCount: number): string[] {
  return [
    `Multi-z alignment (${memberCount}-way)`,
    "Pairwise chains to each other strain",
    "Cross-strain gene projections",
    // TODO(#1341): species-specific — the cohort-variants track is Plasmodium
    // (MalariaGEN) only. Source this per-bundle from pangenomes.json once the
    // real build lands rather than hardcoding it for every species here.
    "MalariaGEN cohort variants (1,895 samples)",
  ];
}
