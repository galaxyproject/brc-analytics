import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

/**
 * Returns array of interactive indexes.
 * @param cards - Cards.
 * @param rows - Number of rows the cards are arranged into.
 * @returns a list of indexes that are interactive.
 */
export function buildInteractiveIndexes(
  cards: DXCardProps[],
  rows: number
): number[] {
  const indexCount = Math.ceil(cards.length / rows);
  return [...Array(indexCount).keys()];
}

/**
 * Returns cards organised by row position.
 * @param cards - Cards.
 * @param rows - Number of rows the cards are arranged into.
 * @returns cards organised by row position.
 */
function organiseCardsByRowPosition(
  cards: DXCardProps[],
  rows: number
): DXCardProps[][] {
  // Calculate the maximum number of cards per row.
  const cardsPerRow = Math.ceil(cards.length / rows);
  // Return the cards organised by row position.
  return [...cards].reduce((acc, card, cardIndex) => {
    const rowIndex = Math.floor(cardIndex / cardsPerRow);
    const row = acc[rowIndex] || [];
    row.push(card);
    acc[rowIndex] = row;
    return acc;
  }, [] as DXCardProps[][]);
}

/**
 * Returns cards rotated into the correct position based on the active index.
 * Each row of cards handles its own rotation.
 * @param cards - Cards.
 * @param activeIndex - Active index.
 * @param swipeEnabled - Boolean indicating cards are swipe-able.
 * @param rows - Number of rows the cards are arranged into.
 * @returns rotated cards.
 */
export function rotateCards(
  cards: DXCardProps[],
  activeIndex: number,
  swipeEnabled: boolean,
  rows: number
): DXCardProps[] {
  if (!swipeEnabled) {
    return cards;
  }
  const organisedCards = organiseCardsByRowPosition(cards, rows);
  return organisedCards.reduce((acc, row) => {
    const rotatedRow: DXCardProps[] = [...row];
    for (let i = 0; i < activeIndex; i++) {
      const firstCard = rotatedRow.shift() as DXCardProps;
      rotatedRow.push(firstCard);
    }
    return acc.concat(rotatedRow);
  }, [] as DXCardProps[]);
}
