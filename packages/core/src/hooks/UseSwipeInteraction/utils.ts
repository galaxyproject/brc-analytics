import { MouseEvent, TouchEvent } from "react";
import { SWIPE_ACTION, SwipeAction, SwipeCoordinates } from "./types";

/**
 * Returns swipe action, calculated from swipe interaction start and end coordinates.
 * @param startCoords - Swipe start coordinates (mouse or touch).
 * @param endCoords - Swipe end coordinates (mouse or touch).
 * @returns swipe action.
 */
export function calculateSwipeAction(
  startCoords: SwipeCoordinates,
  endCoords: SwipeCoordinates
): SwipeAction {
  const { x: x0, y: y0 } = startCoords;
  const { x: x1, y: y1 } = endCoords;

  /* Calculate the difference between mouse/touch start and end coordinates. */
  const dx = x1 - x0;
  const dy = y1 - y0;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  /* Calculate swipe action. */
  /* Start with neutral action. */
  let action = SWIPE_ACTION.NONE;
  if (absX < 8 && absY < 8) {
    /* Selecting. */
    /* Minimal directional change between the start and end interactions. */
    action = SWIPE_ACTION.SELECT;
  } else if (absY > absX) {
    /* Scrolling. */
    /* Vertical interaction is greater than horizontal interaction. */
    action = SWIPE_ACTION.SCROLL;
  } else {
    /* Swiping. */
    /* Determine direction of swipe. */
    const sign = Math.sign(dx);
    if (sign > 0) {
      /* Backwards. */
      /* Swipe has occurred left to right (x1 is greater than x0). */
      action = SWIPE_ACTION.SWIPE_BACKWARD;
    }
    if (sign < 0) {
      /* Forwards. */
      /* Swipe has occurred right to left (x1 is less than x0). */
      action = SWIPE_ACTION.SWIPE_FORWARD;
    }
  }
  return action;
}

/**
 * Returns a single touch point interacting with the touch surface.
 * @param touchEvent - Touch event.
 * @returns single touch point.
 */
function changedTouches(touchEvent: TouchEvent): Touch {
  return touchEvent.changedTouches[0] as Touch;
}

/**
 * Returns the mouse event clientX and clientY coordinates.
 * @param mouseEvent - Mouse event.
 * @returns x and y mouse event coordinates.
 */
export function getMouseCoords(mouseEvent: MouseEvent): SwipeCoordinates {
  const x = mouseEvent.clientX;
  const y = mouseEvent.clientY;
  return { x, y };
}

/**
 * Returns the touch event clientX and clientY coordinates.
 * @param touchEvent - Touch event.
 * @returns x and y touch event coordinates.
 */
export function getTouchCoords(touchEvent: TouchEvent): SwipeCoordinates {
  const x = changedTouches(touchEvent).clientX;
  const y = changedTouches(touchEvent).clientY;
  return { x, y };
}
