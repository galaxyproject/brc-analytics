/**
 * Returns the next index key in a cyclic order.
 * @param indexKeys - Index keys.
 * @param prevIndex - Previous index.
 * @returns next index key.
 */
export function getNextIndex(indexKeys: string[], prevIndex: string): string {
  const currentIndex = indexKeys.findIndex(
    (indexKey) => indexKey === prevIndex
  );
  const nextIndex = (currentIndex + 1) % indexKeys.length;
  return indexKeys[nextIndex];
}
