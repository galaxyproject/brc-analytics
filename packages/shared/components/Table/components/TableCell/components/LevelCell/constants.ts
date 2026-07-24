// Number of bar segments in the level indicator (one per assembly level tier:
// Complete Genome, Chromosome, Scaffold, Contig).
export const BAR_COUNT = 4;

/**
 * Maps each NCBI assembly level to its filled-bar count (most → least complete).
 */
export const LEVEL_FILLED_COUNT: Record<string, number> = {
  Chromosome: 3,
  "Complete Genome": 4,
  Contig: 1,
  Scaffold: 2,
};

/**
 * Overrides the displayed label for specific NCBI assembly levels; levels not
 * listed here display their raw value.
 */
export const LEVEL_LABEL: Record<string, string> = {
  "Complete Genome": "Genome",
};
