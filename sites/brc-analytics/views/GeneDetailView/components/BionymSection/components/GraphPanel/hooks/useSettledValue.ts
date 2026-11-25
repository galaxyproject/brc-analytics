import { useEffect, useState } from "react";

/**
 * A value that follows another once it has stopped changing for a moment.
 * The slider moves in steps of 0.01 while it's dragged, and each value the
 * network takes redraws it in full; this lets a drag redraw it once.
 * @param value - The changing value.
 * @param delayMs - How long the value must hold before it's followed.
 * @returns The settled value.
 */
export function useSettledValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs);
    return (): void => clearTimeout(id);
  }, [value, delayMs]);
  return settled;
}
