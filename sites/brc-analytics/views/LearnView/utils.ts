import { CARDS } from "./constants";
import type { LearnCard } from "./types";

/**
 * Filters out the demo-gated cards unless the demo feature flag is enabled.
 * @param isDemoEnabled - Whether the demo feature flag is enabled.
 * @returns The cards to show under the given flag state.
 */
export function getFilteredCards(isDemoEnabled: boolean): LearnCard[] {
  return CARDS.filter(({ isDemoGated }) => isDemoEnabled || !isDemoGated);
}
