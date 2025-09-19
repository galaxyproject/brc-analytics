import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { RefObject, useEffect, useMemo } from "react";
import { useSwipeInteraction } from "../../../../../../../../../../../hooks/useSwipeInteraction/useSwipeInteraction";
import { ANALYTICS_TOOLS } from "../../common/constants";
import { useIntersectionObserver } from "../useIntersectionObserver/useIntersectionObserver";
import { ROWS } from "./common/constants";
import { UseInteractiveAnalyticsAndData } from "./common/entities";

/**
 * Facilitates interaction capabilities for analytics cards, including swipe-able interactions based on viewport intersection.
 * @param ref -  Ref pointing to the element that the intersection observer monitors.
 * @returns analytics cards ordered by the active index, interactive indexes, and interactive actions.
 */
export function useInteractiveAnalyticsAndData(
  ref: RefObject<HTMLElement>
): UseInteractiveAnalyticsAndData {
  // Intersection observer for analytics cards intersecting the viewport.
  const { isIntersecting } = useIntersectionObserver(ref);
  // Raw cards.
  const analyticsCards = useMemo(() => ANALYTICS_TOOLS, []);
  // Determine if the cards are swipe-able.
  const swipeEnabled = !isIntersecting;
  // Get the interactive indexes.
  const interactiveIndexes = useMemo(
    () => buildInteractiveIndexes(analyticsCards),
    [analyticsCards]
  );
  // Get the active index and interactive actions.
  const swipeInteraction = useSwipeInteraction(
    interactiveIndexes.length,
    swipeEnabled
  );
  const { activeIndex, onSetActiveIndex } = swipeInteraction;
  // Rotate the cards based on the active index.
  const interactiveCards = useMemo(
    () => rotateCards(analyticsCards, activeIndex, swipeEnabled),
    [activeIndex, analyticsCards, swipeEnabled]
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

/**
 * Returns array of interactive indexes.
 * @param cards - Cards.
 * @returns a list of indexes that are interactive.
 */
function buildInteractiveIndexes(cards: DXCardProps[]): number[] {
  const indexCount = Math.ceil(cards.length / ROWS);
  return [...Array(indexCount).keys()];
}

/**
 * Returns cards organised by row position.
 * @param cards - Cards.
 * @returns cards organised by row position.
 */
const organiseCardsByRowPosition = (cards: DXCardProps[]): DXCardProps[][] => {
  // Calculate the maximum number of cards per row.
  const cardsPerRow = Math.ceil(cards.length / ROWS);
  // Return the cards organised by row position.
  return [...cards].reduce((acc, card, cardIndex) => {
    const rowIndex = Math.floor(cardIndex / cardsPerRow);
    const row = acc[rowIndex] || [];
    row.push(card);
    acc[rowIndex] = row;
    return acc;
  }, [] as DXCardProps[][]);
};

/**
 * Returns cards rotated into the correct position based on the active index.
 * Each row of cards handles its own rotation.
 * @param cards - Cards.
 * @param activeIndex - Active index.
 * @param swipeEnabled - Boolean indicating cards are swipe-able.
 * @returns rotated cards.
 */
function rotateCards(
  cards: DXCardProps[],
  activeIndex: number,
  swipeEnabled: boolean
): DXCardProps[] {
  if (!swipeEnabled) {
    return cards;
  }
  const organisedCards = organiseCardsByRowPosition(cards);
  return organisedCards.reduce((acc, row) => {
    const rotatedRow: DXCardProps[] = [...row];
    for (let i = 0; i < activeIndex; i++) {
      const firstCard = rotatedRow.shift() as DXCardProps;
      rotatedRow.push(firstCard);
    }
    return acc.concat(rotatedRow);
  }, [] as DXCardProps[]);
}
