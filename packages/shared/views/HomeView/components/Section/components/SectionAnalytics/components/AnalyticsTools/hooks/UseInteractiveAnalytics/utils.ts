import { type AnalyticsCard } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/types";

/**
 * Returns array of interactive indexes.
 * @param cards - Cards.
 * @returns a list of indexes that are interactive.
 */
export function buildInteractiveIndexes(cards: AnalyticsCard[]): number[] {
  return [...Array(cards.length).keys()];
}

/**
 * Returns cards rotated into the correct position based on the active index.
 * @param cards - Cards.
 * @param activeIndex - Active index.
 * @param swipeEnabled - Boolean indicating cards are swipe-able.
 * @returns rotated cards.
 */
export function rotateCards(
  cards: AnalyticsCard[],
  activeIndex: number,
  swipeEnabled: boolean
): AnalyticsCard[] {
  if (!swipeEnabled) {
    return cards;
  }
  // Normalize so an out-of-range index wraps like the rotation it represents.
  const offset = cards.length ? activeIndex % cards.length : 0;
  return [...cards.slice(offset), ...cards.slice(0, offset)];
}
