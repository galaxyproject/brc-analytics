import type { UseSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/types";
import type { FocusEvent, RefObject } from "react";

export interface UseCardPaging {
  canPageBack: boolean;
  canPageForward: boolean;
  offset: number;
  onFocusCard: (event: FocusEvent<HTMLDivElement>) => void;
  onPageBack: () => void;
  onPageForward: () => void;
  swipeProps: UseSwipeGesture["touchProps"];
  viewportRef: RefObject<HTMLDivElement | null>;
}
