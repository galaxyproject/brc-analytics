import { SWIPE_ACTION } from "../../../../../../../../../../hooks/useSwipeInteraction/common/entities";
import {
  ARROW_OFFSET_Y,
  CARD_OFFSET_Y,
  CARD_SCALE_X,
  MAX_CARD_WIDTH,
  MAX_DECK_SIZE,
  TRANSITION_DELAY,
  TRANSITION_DURATION,
} from "./constants";

/**
 * Returns the arrow's transform scaleX and translateY.
 * @param swipeAction - Swipe action.
 * @returns arrow's transform.
 */
export function getArrowTransform(swipeAction: SWIPE_ACTION): string {
  return swipeAction === SWIPE_ACTION.SWIPE_FORWARD
    ? `translate(24px, calc(${ARROW_OFFSET_Y}px - 50%)) scaleX(-1)`
    : `translate(-24px, calc(${ARROW_OFFSET_Y}px - 50%))`;
}

/**
 * Returns the carousel card's position in the deck.
 * @param index - Card index.
 * @param activeIndex - Active index.
 * @param lastIndex - Last index.
 * @returns card position (position zero to deck size).
 */
export function getCardPosition(
  index: number,
  activeIndex: number,
  lastIndex: number
): number {
  const order = index - activeIndex;
  if (order >= 0) return order;
  // If the order is negative, stack the card to the end of the deck.
  // Grab the last (positive) position in the deck and add the card position (index + 1).
  return lastIndex - activeIndex + index + 1;
}

/**
 * Returns the carousel card's x-axis scale.
 * @param cardPosition - Card position.
 * @returns card x-axis scale.
 */
export function getCardScaleX(cardPosition: number): string {
  if (cardPosition === 0) return "scaleX(1)"; // The active card is scaled to 1.
  return `scaleX(${
    (MAX_CARD_WIDTH - cardPosition * CARD_SCALE_X) / MAX_CARD_WIDTH
  })`;
}

/**
 * Returns the carousel card's transform scaleX and translateY.
 * @param cardPosition - Card position.
 * @returns card transform.
 */
export function getCardTransform(cardPosition: number): string {
  return `${getCardScaleX(cardPosition)} ${getCardTranslateY(cardPosition)}`;
}

/**
 * Returns the carousel card's transition.
 * @param cardPosition - Card position.
 * @returns card transition.
 */
export function getCardTransition(cardPosition: number): string {
  return `all ${TRANSITION_DURATION}ms ease-in-out ${
    cardPosition * TRANSITION_DELAY
  }ms, z-index 0ms ${TRANSITION_DELAY}ms`;
}

/**
 * Returns the carousel card's y-axis offset.
 * @param cardPosition - Card position.
 * @returns y-axis offset.
 */
export function getCardTranslateY(cardPosition: number): string {
  return `translateY(${(MAX_DECK_SIZE - cardPosition) * CARD_OFFSET_Y}px)`;
}

/**
 * Returns the carousel card's z-index.
 * @param cardPosition - Card position.
 * @returns card z-index.
 */
export function getCardZIndex(cardPosition: number): number {
  return MAX_DECK_SIZE - cardPosition;
}
