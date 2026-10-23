import type { RefObject } from "react";

export interface UseFocusRow {
  focusRow: () => void;
  ref: RefObject<HTMLDivElement | null>;
}
