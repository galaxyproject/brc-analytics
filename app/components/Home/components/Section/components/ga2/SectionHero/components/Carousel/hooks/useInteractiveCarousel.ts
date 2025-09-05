import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { useMemo } from "react";
import {
  UseSwipeInteraction,
  useSwipeInteraction,
} from "../../../../../../../../../../hooks/useSwipeInteraction/useSwipeInteraction";
import { CAROUSEL_CARDS } from "../cards/constants";

export interface UseInteractiveCarousel {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: CardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
  onSetSwipeAction: UseSwipeInteraction["onSetSwipeAction"];
}

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
