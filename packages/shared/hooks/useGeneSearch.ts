import { apiClient } from "@repo/shared/services/api-client/api-client";
import {
  GENE_SEARCH_LIMIT,
  GENE_SEARCH_MAX_LENGTH,
  GENE_SEARCH_MAX_WORDS,
} from "@repo/shared/services/genes/constants";
import { type GeneSearchResult } from "@repo/shared/services/genes/types";
import { useQuery } from "@tanstack/react-query";

export type GeneSearchState =
  | { status: "idle" }
  | { status: "invalid" }
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      query: string;
      results: GeneSearchResult[];
      status: "found";
      truncated: boolean;
    };

/**
 * Whether the gene API takes a query: one of at most GENE_SEARCH_MAX_WORDS
 * words and GENE_SEARCH_MAX_LENGTH characters.
 * @param query - The query, trimmed.
 * @returns True if the API takes it.
 */
export function isValidGeneSearch(query: string): boolean {
  return (
    query.length <= GENE_SEARCH_MAX_LENGTH &&
    query.split(/\s+/).length <= GENE_SEARCH_MAX_WORDS
  );
}

/**
 * Search the gene API for up to GENE_SEARCH_LIMIT genes.
 * @param query - The search, or undefined or empty for none.
 * @returns The genes found, loading, or why there are none.
 */
export function useGeneSearch(query: string | undefined): GeneSearchState {
  const q = query?.trim() ?? "";
  const enabled = q !== "" && isValidGeneSearch(q);
  const { data, isError } = useQuery({
    enabled,
    queryFn: ({ signal }) =>
      apiClient.searchGenes(q, GENE_SEARCH_LIMIT, signal),
    queryKey: ["gene-search", q],
    // The snapshot only changes at a deploy, so a search isn't rerun.
    staleTime: Infinity,
  });
  if (q === "") return { status: "idle" };
  if (!enabled) return { status: "invalid" };
  if (data) {
    const { query: searched, results, truncated } = data;
    return { query: searched, results, status: "found", truncated };
  }
  return isError ? { status: "unavailable" } : { status: "loading" };
}
