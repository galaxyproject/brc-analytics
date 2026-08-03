import { CAROUSEL_CARDS } from "@brc/views/HomeView/components/SectionHero/components/Carousel/cards/constants";
import { type CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { useSwipeInteraction } from "@repo/shared/views/HomeView/hooks/UseSwipeInteraction/hook";
import { useMemo } from "react";
import { type UseInteractiveCarousel } from "./types";

/**
 * Facilitates interaction capabilities for the carousel.
 * @returns carousel cards, interactive indexes, and interactive actions.
 */
export function useInteractiveCarousel(): UseInteractiveCarousel {
  // Raw carousel cards.
  const carouselCards = CAROUSEL_CARDS;
  // Get the interactive indexes.
  const interactiveIndexes = useMemo(
    () => buildInteractiveIndexes(carouselCards),
    [carouselCards]
  );
  // Get the active index and interactive actions.
  const swipeInteraction = useSwipeInteraction(
    interactiveIndexes.length,
    true,
    12000
  );
  return {
    interactiveCards: carouselCards,
    interactiveIndexes,
    ...swipeInteraction,
  };
}

/**
 * Returns array of interactive indexes.
 * @param cards - Cards.
 * @returns a list of indexes that are interactive.
 */
function buildInteractiveIndexes(cards: CardProps[]): number[] {
  return [...Array(cards.length).keys()];
}
