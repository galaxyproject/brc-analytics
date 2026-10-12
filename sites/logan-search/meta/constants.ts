/**
 * Page metadata for Logan Search: titles and descriptions used in OG/Twitter
 * meta tags.
 */

export const LOGAN_DEFAULT_DESCRIPTION =
  "Search a DNA sequence against assembled contigs from the entire Sequence Read Archive, and get back the SRA runs it occurs in.";

export const LOGAN_PAGE_META = {
  LEARN: {
    pageDescription:
      "How Logan Search works: inputs, indexes, scores, export and how long results last.",
    pageTitle: "How it works",
  },
  RESULTS: {
    pageDescription:
      "Logan Search results: the SRA runs a sequence occurs in, where they were sampled, and the full match set to download.",
    pageTitle: "Results",
  },
  SEARCH: {
    pageDescription: LOGAN_DEFAULT_DESCRIPTION,
  },
} as const;
