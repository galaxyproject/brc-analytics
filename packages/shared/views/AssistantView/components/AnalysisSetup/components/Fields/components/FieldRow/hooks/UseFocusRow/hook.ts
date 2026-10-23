import { useCallback, useRef } from "react";
import type { UseFocusRow } from "./types";

/**
 * Returns a field row's ref and a callback that moves focus to the row. A chip
 * cleared from the keyboard is disabled while the reply is in flight and then
 * unmounts, so focus would otherwise fall back to the page; the row keeps the
 * user's place, and holds the field's new value once the reply lands.
 * @returns The row's ref, and a callback that focuses it.
 */
export const useFocusRow = (): UseFocusRow => {
  const ref = useRef<HTMLDivElement>(null);

  const focusRow = useCallback((): void => {
    ref.current?.focus();
  }, []);

  return { focusRow, ref };
};
