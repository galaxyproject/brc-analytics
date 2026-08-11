import { useCallback, useEffect, useRef, useState } from "react";
import { type UseAutoCycle } from "./types";
import { getNextIndex } from "./utils";

export function useAutoCycle(indexKeys: string[]): UseAutoCycle {
  const cycleRef = useRef<NodeJS.Timeout | null>(null);
  const [activeIndex, setActiveIndex] = useState<string>(indexKeys[0] ?? "");

  const clearAutoCycle = useCallback((): void => {
    if (cycleRef.current) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
  }, []);

  const startAutoCycle = useCallback((): void => {
    clearAutoCycle();
    if (indexKeys.length === 0) return;
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
    return clearAutoCycle;
  }, [clearAutoCycle, startAutoCycle]);

  return { activeIndex, onSelectIndex };
}
