import { type BionymSource } from "@repo/shared/services/genes/types";

/**
 * The number of claims across the given sources.
 * @param sources - Sources.
 * @returns The claim count.
 */
export function countClaims(sources: BionymSource[]): number {
  return sources.reduce((count, source) => count + source.claims.length, 0);
}

/**
 * Format a confidence for display, to two decimal places.
 * @param confidence - A confidence, from 0 to 1.
 * @returns The formatted confidence.
 */
export function formatConfidence(confidence: number): string {
  return confidence.toFixed(2);
}

/**
 * The sources and claims to show at a minimum confidence: each source's claims
 * at or above it, and the sources that have any, those with the most first.
 * Otherwise the API's order stands: sources by title, and claims by
 * confidence, highest first.
 * @param sources - Sources, as the API gives them.
 * @param minConfidence - The lowest confidence to show.
 * @returns The sources to show, each with only the claims to show.
 */
export function visibleSources(
  sources: BionymSource[],
  minConfidence: number
): BionymSource[] {
  return (
    sources
      .map((source) => ({
        ...source,
        claims: source.claims.filter(
          (claim) => claim.confidence >= minConfidence
        ),
      }))
      .filter((source) => source.claims.length > 0)
      // A stable sort, so sources with as many claims stay in title order.
      .sort((a, b) => b.claims.length - a.claims.length)
  );
}
