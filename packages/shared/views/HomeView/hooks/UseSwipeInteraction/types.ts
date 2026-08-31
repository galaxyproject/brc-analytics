import { type UseSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/types";

export type InteractiveAction = UseSwipeGesture["mouseProps"] &
  UseSwipeGesture["touchProps"] & {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };

export interface UseSwipeInteraction {
  activeIndex: number;
  interactiveAction?: InteractiveAction;
  onSetActiveIndex: (newIndex: number) => void;
}
