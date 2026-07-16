import { MouseEvent, TouchEvent } from "react";

export enum SWIPE_ACTION {
  NONE = "NONE",
  SCROLL = "SCROLL",
  SELECT = "SELECT",
  SWIPE_BACKWARD = "SWIPE_BACKWARD",
  SWIPE_FORWARD = "SWIPE_FORWARD",
}

export type SwipeAction = SWIPE_ACTION;

export interface InteractiveAction {
  onMouseDown: (mouseEvent: MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseUp: (mouseEvent: MouseEvent) => void;
  onTouchEnd: (touchEvent: TouchEvent) => void;
  onTouchMove: (touchEvent: TouchEvent) => void;
  onTouchStart: (touchEvent: TouchEvent) => void;
}

export interface SwipeCoordinates {
  x: number;
  y: number;
}

export interface UseSwipeInteraction {
  activeIndex: number;
  interactiveAction?: InteractiveAction;
  onSetActiveIndex: (newIndex: number) => void;
  onSetSwipeAction: (newSwipeAction: SwipeAction) => void;
}
