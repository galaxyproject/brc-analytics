import { useEffect, useRef, useState } from "react";
import type { UseChipTooltipTitle } from "./types";
import { isLabelOverflowed } from "./utils";

/**
 * Tracks whether the chip's `.MuiChip-label` is truncated by ellipsis,
 * returning the label string as a tooltip title only when it is. Uses
 * `ResizeObserver` on the label element so the title stays accurate
 * across container resizes and font loads; the observer's first callback,
 * which fires on observe, sets the initial value. Re-subscribes when the
 * label changes, since new text in an already-truncated label doesn't
 * resize the element.
 * @param label - Chip label.
 * @returns The ref to attach to the chip element and the tooltip title
 *   (the label when truncated, otherwise null).
 */
export const useChipTooltipTitle = (label: string): UseChipTooltipTitle => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(".MuiChip-label");
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setIsOverflowed(isLabelOverflowed(el))
    );
    observer.observe(el);
    return (): void => observer.disconnect();
  }, [label]);

  return { ref, title: isOverflowed ? label : null };
};
