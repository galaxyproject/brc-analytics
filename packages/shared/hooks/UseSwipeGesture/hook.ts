import { type MouseEvent, type TouchEvent, useCallback, useRef } from "react";
import { DEFAULT_SWIPE_COORDINATES } from "./constants";
import {
  SWIPE_ACTION,
  type SwipeCoordinates,
  type UseSwipeGesture,
} from "./types";
import {
  calculateSwipeAction,
  getMouseCoords,
  getTouchCoords,
  isMultiTouch,
} from "./utils";

/**
 * Reads a swipe over an element and reports its direction, leaving what a swipe
 * means to the caller.
 *
 * The element swiped over is responsible for telling the browser which
 * directions it keeps: `touch-action: pan-y pinch-zoom` leaves vertical
 * scrolling and zooming alone and gives horizontal drags to the swipe. This
 * hook cannot do it -- touch listeners are registered passively, so it cannot
 * cancel the browser's own handling.
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
  // A gesture a second finger joined is a pinch for the rest of its life, however
  // many fingers are left by the time it ends.
  const swipeableRef = useRef(true);

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
      const swipeable = swipeableRef.current;
      // The last finger up ends the gesture, whatever it turned out to be.
      if (touchEvent.touches.length === 0) swipeableRef.current = true;
      if (!swipeable) return;
      onSwipeEnd(getTouchCoords(touchEvent));
    },
    [onSwipeEnd]
  );

  // A second finger means a pinch: what either finger reports says nothing
  // about a swipe, and the gesture belongs to the browser.
  const onTouchStart = useCallback((touchEvent: TouchEvent): void => {
    if (isMultiTouch(touchEvent)) {
      swipeableRef.current = false;
      return;
    }
    swipeableRef.current = true;
    startCoordsRef.current = getTouchCoords(touchEvent);
  }, []);

  return {
    mouseProps: { onMouseDown, onMouseUp },
    touchProps: { onTouchEnd, onTouchStart },
  };
}
