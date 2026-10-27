import type { CSSProperties, RefObject } from "react";

export interface UseFooterClearance {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties | undefined;
}
