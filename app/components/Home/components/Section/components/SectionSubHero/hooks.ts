import { useCallback, useEffect, useRef, useState } from "react";
import { UseAutoCycle } from "./types";

export function useAutoCycle(indexKeys: string[]): UseAutoCycle {
  const cycleRef = useRef<NodeJS.Timeout | null>(null);
  const [activeIndex, setActiveIndex] = useState<string>(indexKeys[0]);

  const clearAutoCycle = useCallback((): void => {
    if (cycleRef.current) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
  }, []);

  const startAutoCycle = useCallback((): void => {
    clearAutoCycle();
    cycleRef.current = setInterval(
      () => setActiveIndex((prevIndex) => getNextIndex(indexKeys, prevIndex)),
      5000
    );
  }, [clearAutoCycle, indexKeys]);

  const onSelectIndex = useCallback(
    (indexKey: string): void => {
      setActiveIndex(indexKey);
      startAutoCycle();
    },
    [startAutoCycle]
  );

  useEffect(() => {
    startAutoCycle();
    return clearAutoCycle();
  }, [clearAutoCycle, startAutoCycle]);

  return { activeIndex, onSelectIndex };
}

/**
 * Returns the next index key in a cyclic order.
 * @param indexKeys - Index keys.
 * @param prevIndex - Previous index.
 * @returns next index key.
 */
function getNextIndex(indexKeys: string[], prevIndex: string): string {
  const currentIndex = indexKeys.findIndex(
    (indexKey) => indexKey === prevIndex
  );
  const nextIndex = (currentIndex + 1) % indexKeys.length;
  return indexKeys[nextIndex];
}
