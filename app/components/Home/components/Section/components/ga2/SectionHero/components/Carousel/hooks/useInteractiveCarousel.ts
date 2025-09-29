import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { useMemo } from "react";
import {
  UseSwipeInteraction,
  useSwipeInteraction,
} from "../../../../../../../../../../hooks/useSwipeInteraction/useSwipeInteraction";
import { CAROUSEL_CARDS } from "../cards/constants";

export interface UseInteractiveCarousel {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
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
  // Get the index count.
  const indexCount = interactiveIndexes.length;
  // Is swipe interaction enabled?
  const swipeEnabled = indexCount > 1;
  // Determine swipe delay.
  const swipeDelay = useMemo(() => (swipeEnabled ? 12000 : 0), [swipeEnabled]);
  // Get the active index and interactive actions.
  const swipeInteraction = useSwipeInteraction(
    indexCount,
    swipeEnabled,
    swipeDelay
  );
  return {
    interactionEnabled: swipeEnabled,
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
