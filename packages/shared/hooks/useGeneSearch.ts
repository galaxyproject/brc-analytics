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
  // retry runs the failed search again.
  | { retry: () => void; status: "unavailable" }
  | {
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
 * @param q - The search, trimmed; empty for none.
 * @returns The genes found, loading, or why there are none.
 */
export function useGeneSearch(q: string): GeneSearchState {
  const enabled = q !== "" && isValidGeneSearch(q);
  const { data, isError, refetch } = useQuery({
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
    const { results, truncated } = data;
    return { results, status: "found", truncated };
  }
  // A retry of a failed search is loading until it answers: refetching a
  // query with no data puts it back to pending, so isError is false.
  if (isError)
    return { retry: (): void => void refetch(), status: "unavailable" };
  return { status: "loading" };
}
