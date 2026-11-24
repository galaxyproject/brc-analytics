import { apiClient } from "@repo/shared/services/api-client/api-client";
import { HTTPError } from "ky";
import { type BionymClaims, type BionymGraph, type Gene } from "./types";

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
    if (isNotFound(error)) return { status: "not_found" };
    throw error;
  }
}

/**
 * Fetch the claims in a gene's BioNym graph.
 * @param geneUid - The gene's UID.
 * @param signal - Aborts the request.
 * @returns The claims, or null when the gene has no BioNym graph.
 * @throws When the API can't be reached.
 */
export async function fetchGeneBionym(
  geneUid: string,
  signal?: AbortSignal
): Promise<BionymClaims | null> {
  try {
    return await apiClient.getGeneBionym(geneUid, signal);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/**
 * Fetch a gene's BioNym graph.
 * @param geneUid - The gene's UID.
 * @param signal - Aborts the request.
 * @returns The graph, or null when the gene has no BioNym graph.
 * @throws When the API can't be reached.
 */
export async function fetchGeneBionymGraph(
  geneUid: string,
  signal?: AbortSignal
): Promise<BionymGraph | null> {
  try {
    return await apiClient.getGeneBionymGraph(geneUid, signal);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/**
 * Whether a gene API request failed because what it asked for doesn't exist.
 * @param error - The request's error.
 * @returns True for a 404, or a 422: a UID that isn't a UUID, which no gene has.
 */
function isNotFound(error: unknown): boolean {
  return (
    error instanceof HTTPError &&
    (error.response.status === 404 || error.response.status === 422)
  );
}
