import { fetchGene, type GeneResult } from "@repo/shared/services/genes/api";
import { useQuery } from "@tanstack/react-query";

export type GeneState =
  | GeneResult
  | { status: "loading" }
  | { status: "unavailable" };

/**
 * Fetch one gene from the gene API.
 * @param geneUid - The gene's UID, or undefined while it isn't known yet.
 * @returns The gene, loading, or why there is none.
 */
export function useGene(geneUid: string | undefined): GeneState {
  const { data, isError } = useQuery({
    enabled: Boolean(geneUid),
    queryFn: ({ signal }) => fetchGene(geneUid as string, signal),
    queryKey: ["gene", geneUid],
    // The snapshot only changes at a deploy, so a loaded gene isn't refetched;
    // and a failed retry keeps the gene already shown.
    staleTime: Infinity,
  });
  if (data) return data;
  return isError ? { status: "unavailable" } : { status: "loading" };
}
