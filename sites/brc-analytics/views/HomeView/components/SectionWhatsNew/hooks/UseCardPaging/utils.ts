import {
  CARD_GAP,
  CARD_INDEX_ATTRIBUTE,
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
 * Returns the index of the card the focus landed in.
 * @param target - Element that took focus.
 * @returns Index of the card, or undefined where the focus is outside them.
 */
export function getFocusedCardIndex(target: Element): number | undefined {
  const card = target.closest(`[${CARD_INDEX_ATTRIBUTE}]`);
  if (!card) return;
  const index = Number(card.getAttribute(CARD_INDEX_ATTRIBUTE));
  return Number.isInteger(index) ? index : undefined;
}

/**
 * Returns the page that brings the given card into view, moving the row as
 * little as it takes: a card already in view leaves it where it is.
 * @param cardIndex - Index of the card to bring into view.
 * @param pageIndex - Index of the first card currently in view.
 * @param viewportWidth - Width available to the cards.
 * @param cardCount - Number of cards.
 * @returns Index of the first card to show.
 */
export function getIndexInView(
  cardIndex: number,
  pageIndex: number,
  viewportWidth: number,
  cardCount: number
): number {
  if (cardIndex < pageIndex) return cardIndex;
  const visibleCount = getVisibleCount(viewportWidth);
  if (cardIndex < pageIndex + visibleCount) return pageIndex;
  return Math.min(
    cardIndex - visibleCount + 1,
    getMaxIndex(viewportWidth, cardCount)
  );
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
 * Returns how many cards the paging area holds at once. Counts whole cards
 * only: one bleeding past the column is on its way in, not in view.
 * @param viewportWidth - Width available to the cards.
 * @returns Number of cards in view.
 */
export function getVisibleCount(viewportWidth: number): number {
  const count = Math.floor(
    (getAreaWidth(viewportWidth) + CARD_GAP) / getStep(viewportWidth)
  );
  return Math.max(1, count);
}

/**
 * Returns whether an element took focus from the keyboard rather than a
 * pointer.
 * @param target - Element that took focus.
 * @returns True where the focus is keyboard-driven.
 */
export function isKeyboardFocus(target: Element): boolean {
  try {
    return target.matches(":focus-visible");
  } catch {
    // Where the selector is not understood, matching it throws rather than
    // returning false. Read that as "not keyboard focus": the row then pages
    // by its arrows alone, where throwing out of a focus handler would take
    // the arrows with it.
    return false;
  }
}

/**
 * Returns how far one page turn moves the row: a card and the gap after it.
 * @param viewportWidth - Width available to the cards.
 * @returns Step in pixels.
 */
function getStep(viewportWidth: number): number {
  return getCardWidth(viewportWidth) + CARD_GAP;
}
