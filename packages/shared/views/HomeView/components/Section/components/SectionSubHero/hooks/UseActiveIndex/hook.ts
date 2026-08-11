import { useState } from "react";
import { type UseActiveIndex } from "./types";

/**
 * Tracks the active index for the sub-hero. The given index is active on mount;
 * the user changes it by selecting a step.
 * @param initialIndex - Index active on mount.
 * @returns the active index and a setter to select an index.
 */
export function useActiveIndex(initialIndex: string): UseActiveIndex {
  const [activeIndex, setActiveIndex] = useState<string>(initialIndex);
  return { activeIndex, onSelectIndex: setActiveIndex };
}
