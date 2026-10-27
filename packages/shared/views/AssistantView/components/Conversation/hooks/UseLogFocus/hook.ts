import { useCallback, useRef } from "react";
import type { UseLogFocus } from "./types";

/**
 * Holds the ref to the messages' log, so controls outside it can move focus to
 * it without scrolling, as when the control they were on is about to go.
 * @returns Ref for the log, and a handler that focuses it.
 */
export const useLogFocus = (): UseLogFocus => {
  const logRef = useRef<HTMLDivElement>(null);

  const onFocusLog = useCallback((): void => {
    logRef.current?.focus({ preventScroll: true });
  }, []);

  return { logRef, onFocusLog };
};
