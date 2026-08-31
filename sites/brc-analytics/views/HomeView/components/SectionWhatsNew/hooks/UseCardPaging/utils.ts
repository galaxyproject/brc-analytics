import {
  CARD_GAP,
  CARD_WIDTH,
  CONTENT_WIDTH,
} from "@brc/views/HomeView/components/SectionWhatsNew/components/Cards/constants";

/**
 * Returns the width the cards page within: the content column, or the space
 * available where that is narrower.
 * @param viewportWidth - Width available to the cards.
 * @returns Width of the paging area.
 */
export function getAreaWidth(viewportWidth: number): number {
  return Math.min(CONTENT_WIDTH, viewportWidth);
}

/**
 * Returns the rendered width of a card: the design's width, or the paging
 * area's where that doesn't fit.
 * @param viewportWidth - Width available to the cards.
 * @returns Card width.
 */
export function getCardWidth(viewportWidth: number): number {
  return Math.min(CARD_WIDTH, getAreaWidth(viewportWidth));
}

/**
 * Returns the number of pages that can be turned before the row runs out.
 * @param viewportWidth - Width available to the cards.
 * @param cardCount - Number of cards.
 * @returns Highest index that can be paged to.
 */
export function getMaxIndex(viewportWidth: number, cardCount: number): number {
  if (viewportWidth <= 0) return 0;
  return Math.ceil(
    getMaxOffset(viewportWidth, cardCount) / getStep(viewportWidth)
  );
}

/**
 * Returns the furthest the row can shift: the point where its last card sits
 * inside the content column rather than out in the bleed.
 * @param viewportWidth - Width available to the cards.
 * @param cardCount - Number of cards.
 * @returns Offset in pixels.
 */
export function getMaxOffset(viewportWidth: number, cardCount: number): number {
  const rowWidth =
    cardCount * getCardWidth(viewportWidth) + (cardCount - 1) * CARD_GAP;
  return Math.max(0, rowWidth - getAreaWidth(viewportWidth));
}

/**
 * Returns how far the row is shifted to bring the given card first, stopping
 * once the last card is inside the content column.
 * @param index - Index of the first visible card.
 * @param viewportWidth - Width available to the cards.
 * @param cardCount - Number of cards.
 * @returns Offset in pixels.
 */
export function getOffset(
  index: number,
  viewportWidth: number,
  cardCount: number
): number {
  return Math.min(
    index * getStep(viewportWidth),
    getMaxOffset(viewportWidth, cardCount)
  );
}

/**
 * Returns how far one page turn moves the row: a card and the gap after it.
 * @param viewportWidth - Width available to the cards.
 * @returns Step in pixels.
 */
function getStep(viewportWidth: number): number {
  return getCardWidth(viewportWidth) + CARD_GAP;
}
