/**
 * Returns the next index key in a cyclic order.
 * @param indexKeys - Index keys.
 * @param prevIndex - Previous index.
 * @returns next index key.
 */
export function getNextIndex(indexKeys: string[], prevIndex: string): string {
  if (indexKeys.length === 0) return prevIndex;
  const currentIndex = indexKeys.findIndex(
    (indexKey) => indexKey === prevIndex
  );
  const nextIndex = (currentIndex + 1) % indexKeys.length;
  return indexKeys[nextIndex];
}
