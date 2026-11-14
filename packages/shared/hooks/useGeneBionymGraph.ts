import { fetchGeneBionymGraph } from "@repo/shared/services/genes/api";
import { type BionymGraph } from "@repo/shared/services/genes/types";
import { useQuery } from "@tanstack/react-query";

export type GeneBionymGraphResult =
  | { graph: BionymGraph; status: "found" }
  | { status: "loading" }
  | { status: "unavailable" };

/**
 * Fetch a gene's BioNym graph, for the graph explorer.
 * @param geneUid - The gene's UID.
 * @returns The graph; loading while it loads; or unavailable when the gene
 * has no graph or the API can't be reached.
 */
export function useGeneBionymGraph(geneUid: string): GeneBionymGraphResult {
  const { data, isError, isPending } = useQuery({
    queryFn: ({ signal }) => fetchGeneBionymGraph(geneUid, signal),
    queryKey: ["gene-bionym-graph", geneUid],
    // The graphs only change at a deploy, so a loaded graph isn't refetched.
    staleTime: Infinity,
  });
  if (isPending) return { status: "loading" };
  if (isError || !data) return { status: "unavailable" };
  return { graph: data, status: "found" };
}
