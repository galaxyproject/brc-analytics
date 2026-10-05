import { useIntersectionObserver } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/hooks/UseIntersectionObserver/hook";
import { type AnalyticsCard } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/types";
import { useSwipeInteraction } from "@repo/shared/views/HomeView/hooks/UseSwipeInteraction/hook";
import { type RefObject, useEffect, useMemo } from "react";
import { type UseInteractiveAnalytics } from "./types";
import { buildInteractiveIndexes, rotateCards } from "./utils";

/**
 * Facilitates interaction capabilities for analytics cards, including swipe-able interactions based on viewport intersection.
 * @param ref -  Ref pointing to the element that the intersection observer monitors.
 * @param cards - Cards to display.
 * @returns analytics cards ordered by the active index, interactive indexes, and interactive actions.
 */
export function useInteractiveAnalytics(
  ref: RefObject<HTMLElement | null>,
  cards: AnalyticsCard[]
): UseInteractiveAnalytics {
  // Intersection observer for analytics cards intersecting the viewport.
  const { isIntersecting } = useIntersectionObserver(ref);
  // Determine if the cards are swipe-able.
  const swipeEnabled = !isIntersecting;
  // Get the interactive indexes.
  const interactiveIndexes = useMemo(
    () => buildInteractiveIndexes(cards),
    [cards]
  );
  // Get the active index and interactive actions.
  const swipeInteraction = useSwipeInteraction(
    interactiveIndexes.length,
    swipeEnabled
  );
  const { activeIndex, onSetActiveIndex } = swipeInteraction;
  // Rotate the cards based on the active index.
  const interactiveCards = useMemo(
    () => rotateCards(cards, activeIndex, swipeEnabled),
    [activeIndex, cards, swipeEnabled]
  );

  // Reset the active index when swipe-ability changes.
  useEffect(() => {
    onSetActiveIndex(0);
  }, [swipeEnabled, onSetActiveIndex]);

  return {
    interactionEnabled: swipeEnabled,
    interactiveCards,
    interactiveIndexes,
    ...swipeInteraction,
  };
}
