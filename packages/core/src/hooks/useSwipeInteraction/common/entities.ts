export enum SWIPE_ACTION {
  NONE = "NONE",
  SCROLL = "SCROLL",
  SELECT = "SELECT",
  SWIPE_BACKWARD = "SWIPE_BACKWARD",
  SWIPE_FORWARD = "SWIPE_FORWARD",
}

export type SwipeAction = SWIPE_ACTION;

export interface SwipeCoordinates {
  x: number;
  y: number;
}
