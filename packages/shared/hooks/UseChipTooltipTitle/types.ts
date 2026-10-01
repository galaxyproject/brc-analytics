import type { RefObject } from "react";

export interface UseChipTooltipTitle {
  ref: RefObject<HTMLDivElement | null>;
  title: string | null;
}
