import { type MouseEvent, type TouchEvent, useCallback, useRef } from "react";
import { DEFAULT_SWIPE_COORDINATES } from "./constants";
import {
  SWIPE_ACTION,
  type SwipeCoordinates,
  type UseSwipeGesture,
} from "./types";
import { calculateSwipeAction, getMouseCoords, getTouchCoords } from "./utils";

/**
 * Reads a swipe over an element and reports its direction, leaving what a swipe
 * means to the caller.
 * @param onSwipeBackward - Called when the swipe runs left to right.
 * @param onSwipeForward - Called when the swipe runs right to left.
 * @returns Mouse and touch props, spread onto the element swiped over.
 */
export function useSwipeGesture(
  onSwipeBackward: () => void,
  onSwipeForward: () => void
): UseSwipeGesture {
  // One coordinate: a device swipes with a mouse or a finger, not both at once.
  const startCoordsRef = useRef<SwipeCoordinates>(DEFAULT_SWIPE_COORDINATES);

  // Reports the swipe once it ends rather than following the pointer, so a
  // caller moves a whole step at a time.
  const onSwipeEnd = useCallback(
    (endCoords: SwipeCoordinates): void => {
      const action = calculateSwipeAction(startCoordsRef.current, endCoords);
      // Anything else is a tap or a scroll, and is not a swipe.
      if (action === SWIPE_ACTION.SWIPE_FORWARD) onSwipeForward();
      else if (action === SWIPE_ACTION.SWIPE_BACKWARD) onSwipeBackward();
    },
    [onSwipeBackward, onSwipeForward]
  );

  const onMouseDown = useCallback((mouseEvent: MouseEvent): void => {
    startCoordsRef.current = getMouseCoords(mouseEvent);
  }, []);

  const onMouseUp = useCallback(
    (mouseEvent: MouseEvent): void => {
      onSwipeEnd(getMouseCoords(mouseEvent));
    },
    [onSwipeEnd]
  );

  const onTouchEnd = useCallback(
    (touchEvent: TouchEvent): void => {
      onSwipeEnd(getTouchCoords(touchEvent));
    },
    [onSwipeEnd]
  );

  const onTouchMove = useCallback((touchEvent: TouchEvent): void => {
    const action = calculateSwipeAction(
      startCoordsRef.current,
      getTouchCoords(touchEvent)
    );
    /* Prevent scrolling when swipe action is not SCROLL. */
    if (action !== SWIPE_ACTION.SCROLL && touchEvent.cancelable) {
      touchEvent.preventDefault();
      touchEvent.stopPropagation();
    }
  }, []);

  const onTouchStart = useCallback((touchEvent: TouchEvent): void => {
    startCoordsRef.current = getTouchCoords(touchEvent);
  }, []);

  return {
    mouseProps: { onMouseDown, onMouseUp },
    touchProps: { onTouchEnd, onTouchMove, onTouchStart },
  };
}
