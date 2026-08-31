import { type UseSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/types";

export type InteractiveAction = UseSwipeGesture["mouseProps"] &
  UseSwipeGesture["touchProps"];

export interface UseSwipeInteraction {
  activeIndex: number;
  interactiveAction?: InteractiveAction;
  onSetActiveIndex: (newIndex: number) => void;
}
