import { CARDS } from "./constants";
import type { LearnCard } from "./types";

/**
 * Filters out the gated cards whose flag is off.
 * @param isDemoEnabled - Whether the demo feature flag is enabled.
 * @param isLoganSearchEnabled - Whether Logan Search is advertised.
 * @returns The cards to show under the given flag state.
 */
export function getFilteredCards(
  isDemoEnabled: boolean,
  isLoganSearchEnabled = false
): LearnCard[] {
  return CARDS.filter(
    ({ isDemoGated, isLoganSearchGated }) =>
      (isDemoEnabled || !isDemoGated) &&
      (isLoganSearchEnabled || !isLoganSearchGated)
  );
}
