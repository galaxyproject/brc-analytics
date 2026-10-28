import type { RefObject } from "react";

export interface UseLogFocus {
  logRef: RefObject<HTMLDivElement | null>;
  onFocusLog: () => void;
}
