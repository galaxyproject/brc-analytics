import { useSwipeInteraction } from "@brc-analytics/core/hooks/UseSwipeInteraction/hook";
import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { RefObject, useEffect, useMemo } from "react";
import { useIntersectionObserver } from "../UseIntersectionObserver/hook";
import { UseInteractiveAnalytics } from "./types";
import { buildInteractiveIndexes, rotateCards } from "./utils";

/**
 * Facilitates interaction capabilities for analytics cards, including swipe-able interactions based on viewport intersection.
 * @param ref - Ref pointing to the element that the intersection observer monitors.
 * @param cards - Cards to display.
 * @param rows - Number of rows the cards are arranged into.
 * @returns analytics cards ordered by the active index, interactive indexes, and interactive actions.
 */
export function useInteractiveAnalytics(
  ref: RefObject<HTMLElement | null>,
  cards: DXCardProps[],
  rows = 1
): UseInteractiveAnalytics {
  // Intersection observer for analytics cards intersecting the viewport.
  const { isIntersecting } = useIntersectionObserver(ref);
  // Raw cards.
  const analyticsCards = useMemo(() => cards, [cards]);
  // Determine if the cards are swipe-able.
  const swipeEnabled = !isIntersecting;
  // Get the interactive indexes.
  const interactiveIndexes = useMemo(
    () => buildInteractiveIndexes(analyticsCards, rows),
    [analyticsCards, rows]
  );
  // Get the active index and interactive actions.
  const swipeInteraction = useSwipeInteraction(
    interactiveIndexes.length,
    swipeEnabled
  );
  const { activeIndex, onSetActiveIndex } = swipeInteraction;
  // Rotate the cards based on the active index.
  const interactiveCards = useMemo(
    () => rotateCards(analyticsCards, activeIndex, swipeEnabled, rows),
    [activeIndex, analyticsCards, swipeEnabled, rows]
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
