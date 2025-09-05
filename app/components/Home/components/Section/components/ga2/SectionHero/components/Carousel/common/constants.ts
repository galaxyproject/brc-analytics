export const CARD_OFFSET_Y = 8;
export const CARD_SCALE_X = 40;
export const MAX_CARD_HEIGHT = 216;
export const MAX_CARD_HEIGHT_SM = 280;
export const MAX_DECK_SIZE = 1; // Currently, deck size is only 1 additional card.
export const MAX_CARD_WIDTH = 504;
export const CAROUSEL_HEIGHT = MAX_CARD_HEIGHT + MAX_DECK_SIZE * CARD_OFFSET_Y;
export const CAROUSEL_HEIGHT_SM =
  MAX_CARD_HEIGHT_SM + MAX_DECK_SIZE * CARD_OFFSET_Y;
export const TRANSITION_DELAY = 100;
export const TRANSITION_DURATION = 100;
export const ARROW_OFFSET_Y = (CARD_OFFSET_Y * MAX_DECK_SIZE) / 2;
