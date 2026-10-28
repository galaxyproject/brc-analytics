import { apiClient } from "@repo/shared/services/api-client/api-client";
import { HTTPError } from "ky";
import { type Gene } from "./types";

export type GeneResult =
  | { gene: Gene; status: "found" }
  | { status: "not_found" };

/**
 * Fetch one gene from the gene API.
 * @param geneUid - The gene's UID.
 * @param signal - Aborts the request.
 * @returns The gene, or not_found when the API doesn't have it.
 * @throws When the API, or its gene data, can't be reached.
 */
export async function fetchGene(
  geneUid: string,
  signal?: AbortSignal
): Promise<GeneResult> {
  try {
    const { gene } = await apiClient.getGene(geneUid, signal);
    return { gene, status: "found" };
  } catch (error) {
    // 422 is a UID that isn't a UUID: no gene has it either.
    if (
      error instanceof HTTPError &&
      (error.response.status === 404 || error.response.status === 422)
    )
      return { status: "not_found" };
    throw error;
  }
}
