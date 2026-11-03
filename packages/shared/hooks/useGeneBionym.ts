import { fetchGeneBionym } from "@repo/shared/services/genes/api";
import { type BionymClaims } from "@repo/shared/services/genes/types";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch the claims in a gene's BioNym graph.
 * @param geneUid - The gene's UID, or undefined while it isn't known yet.
 * @returns The claims; or null when the gene has no graph, the graph is still
 * loading, or the API can't be reached, since the gene page shows no BioNym
 * section in any of those cases.
 */
export function useGeneBionym(
  geneUid: string | undefined
): BionymClaims | null {
  const { data } = useQuery({
    enabled: Boolean(geneUid),
    queryFn: ({ signal }) => fetchGeneBionym(geneUid as string, signal),
    queryKey: ["gene-bionym", geneUid],
    // The graphs only change at a deploy, so loaded claims aren't refetched.
    staleTime: Infinity,
  });
  return data ?? null;
}
