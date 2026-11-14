import { type BionymSource } from "@repo/shared/services/genes/types";
import { CONFIDENCE_STEP, TAB } from "./constants";
import { type BionymTab } from "./types";

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
 * The tab a URL hash selects; the Claims tab for any other hash.
 * @param hash - The URL hash, without its leading "#".
 * @returns The tab.
 */
export function getActiveTab(hash: string): BionymTab {
  return hash === TAB.GRAPH ? TAB.GRAPH : TAB.CLAIMS;
}

/**
 * Rethrow a navigation's error, unless Next cancelled the navigation for a
 * newer one, as it does when a second tab is chosen before the first renders.
 * @param error - The error a Next navigation rejected with.
 */
export function rethrowUnlessCancelled(error: unknown): void {
  if (
    error instanceof Error &&
    "cancelled" in error &&
    error.cancelled === true
  )
    return;
  throw error;
}

/**
 * Round a slider value to the slider's step. The slider's arrow keys add the
 * step without rounding, so five steps from 0.8 give 0.8500000000000001, which
 * would hide the claims at 0.85 while the slider reads 0.85.
 * @param value - A slider value.
 * @returns The value, rounded to the step.
 */
export function roundToStep(value: number): number {
  // Divide by the steps per unit (100) rather than multiply by the step (0.01):
  // 95 * 0.01 is 0.9500000000000001, while 95 / 100 is 0.95.
  const stepsPerUnit = Math.round(1 / CONFIDENCE_STEP);
  return Math.round(value * stepsPerUnit) / stepsPerUnit;
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
