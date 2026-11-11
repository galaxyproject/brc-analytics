// The kinds of source BioNym draws claims from.
export const SOURCE_KIND = {
  DATASET: "dataset",
  PAPER: "paper",
} as const;

// What the gene pages show for an empty value.
export const EMPTY_VALUE = "—";

// The most genes a search returns, and the gene API's limit.
export const GENE_SEARCH_LIMIT = 50;

// The gene API's limits on a search query.
export const GENE_SEARCH_MAX_LENGTH = 200;
export const GENE_SEARCH_MAX_WORDS = 10;
