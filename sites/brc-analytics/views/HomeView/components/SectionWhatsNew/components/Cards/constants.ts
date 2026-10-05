import { SECTION_MAX_WIDTH } from "@repo/shared/components/layout/Section/constants";

/**
 * Marks each card with its place in the row, so focus landing inside one can be
 * paged into view.
 */
export const CARD_INDEX_ATTRIBUTE = "data-card-index";

/** Width of a card, and the gap between cards, as the design lays them out. */
export const CARD_GAP = 16;
export const CARD_WIDTH = 560;

/**
 * Width of the content column the cards page within, taken from the shared
 * section layout: cards bleed past it to the right, but the last page brings
 * the final card back inside it.
 */
export const CONTENT_WIDTH = SECTION_MAX_WIDTH;
