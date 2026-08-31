import type { UseSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/types";
import type { RefObject } from "react";

export interface UseCardPaging {
  canPageBack: boolean;
  canPageForward: boolean;
  offset: number;
  onPageBack: () => void;
  onPageForward: () => void;
  swipeProps: UseSwipeGesture["touchProps"];
  viewportRef: RefObject<HTMLDivElement | null>;
}
