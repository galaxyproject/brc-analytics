import { type MouseEvent, type TouchEvent } from "react";

export enum SWIPE_ACTION {
  NONE = "NONE",
  SCROLL = "SCROLL",
  SELECT = "SELECT",
  SWIPE_BACKWARD = "SWIPE_BACKWARD",
  SWIPE_FORWARD = "SWIPE_FORWARD",
}

export interface MouseProps {
  onMouseDown: (mouseEvent: MouseEvent) => void;
  onMouseUp: (mouseEvent: MouseEvent) => void;
}

export type SwipeAction = SWIPE_ACTION;

export interface SwipeCoordinates {
  x: number;
  y: number;
}

export interface TouchProps {
  onTouchEnd: (touchEvent: TouchEvent) => void;
  onTouchStart: (touchEvent: TouchEvent) => void;
}

export interface UseSwipeGesture {
  mouseProps: MouseProps;
  touchProps: TouchProps;
}
