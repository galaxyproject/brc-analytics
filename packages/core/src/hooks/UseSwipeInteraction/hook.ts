import {
  MouseEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { DEFAULT_ACTIVE_INDEX, DEFAULT_SWIPE_COORDINATES } from "./constants";
import {
  SWIPE_ACTION,
  SwipeAction,
  SwipeCoordinates,
  UseSwipeInteraction,
} from "./types";
import { calculateSwipeAction, getMouseCoords, getTouchCoords } from "./utils";

/**
 * Swipe actions over swipe-able "views" i.e. cards etc.
 * @param indexCount - Number of swipe-able / interactive "views".
 * @param swipeEnabled - Swipe interaction is enabled.
 * @param swipeDelay - Timeout delay for auto-swipe.
 * @returns swipe actions and active swipe index.
 */
export function useSwipeInteraction(
  indexCount: number,
  swipeEnabled = true,
  swipeDelay = 0
): UseSwipeInteraction {
  const [interactiveDelay, setInteractiveDelay] = useState<number>(swipeDelay);
  const swipeStartCoordsRef = useRef<SwipeCoordinates>(
    DEFAULT_SWIPE_COORDINATES
  );
  const [activeIndex, setActiveIndex] = useState<number>(DEFAULT_ACTIVE_INDEX);
  const [swipeAction, setSwipeAction] = useState<SwipeAction>(
    SWIPE_ACTION.NONE
  );
  const lastIndex = indexCount - 1;

  const onMouseDown = useCallback((mouseEvent: MouseEvent): void => {
    swipeStartCoordsRef.current = getMouseCoords(mouseEvent);
  }, []);

  const onMouseEnter = useCallback((): void => {
    setInteractiveDelay(0);
  }, []);

  const onMouseLeave = useCallback((): void => {
    setInteractiveDelay(swipeDelay);
  }, [swipeDelay]);

  const onMouseUp = useCallback((mouseEvent: MouseEvent): void => {
    const mouseStartCoords = swipeStartCoordsRef.current;
    const mouseEndCoords = getMouseCoords(mouseEvent);
    const action = calculateSwipeAction(mouseStartCoords, mouseEndCoords);
    /* Set new swipe action. */
    setSwipeAction(action);
  }, []);

  const onSetActiveIndex = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
  }, []);

  const onSetSwipeAction = useCallback((newSwipeAction: SwipeAction) => {
    setSwipeAction(newSwipeAction);
  }, []);

  const onSwipeToIndex = useCallback(
    (increment: number): void => {
      /* Increment index either way. */
      let newIndex = activeIndex + increment;
      if (newIndex < 0) {
        /* The action is SWIPE_BACKWARDS; */
        /* If the new index is negative, rotate to the last index. */
        newIndex = lastIndex;
      } else if (newIndex > lastIndex) {
        /* The action is SWIPE_FORWARDS. */
        /* If the new index is greater than the last possible index, rotate to the first index. */
        newIndex = 0;
      }
      /* Set new rotation index. */
      setActiveIndex(newIndex);
    },
    [activeIndex, lastIndex]
  );

  const onTouchEnd = useCallback((touchEvent: TouchEvent): void => {
    const touchStartCoords = swipeStartCoordsRef.current;
    const touchEndCoords = getTouchCoords(touchEvent);
    const action = calculateSwipeAction(touchStartCoords, touchEndCoords);
    /* Set new swipe action. */
    setSwipeAction(action);
  }, []);

  const onTouchMove = useCallback((touchEvent: TouchEvent): void => {
    const touchStartCoords = swipeStartCoordsRef.current;
    const touchEventCoords = getTouchCoords(touchEvent);
    const action = calculateSwipeAction(touchStartCoords, touchEventCoords);
    /* Prevent scrolling when swipe action is not SCROLL. */
    if (action !== SWIPE_ACTION.SCROLL && touchEvent.cancelable) {
      touchEvent.preventDefault();
      touchEvent.stopPropagation();
    }
  }, []);

  const onTouchStart = useCallback((touchEvent: TouchEvent): void => {
    swipeStartCoordsRef.current = getTouchCoords(touchEvent);
  }, []);

  // Consume a dispatched swipe action: `swipeAction` is set both by the pointer
  // handlers and by the public `onSetSwipeAction` API (e.g. the Carousel arrow
  // buttons). This effect handles the discrete actions (FORWARD/BACKWARD advance
  // the index; SELECT is a no-op) and acknowledges each by resetting to NONE;
  // SCROLL/NONE are intentionally ignored. The reset is the "ack" half of a
  // reducer-style action cycle rather than derived state, so it's kept as an
  // effect deliberately: the shared external entry point means the logic can't
  // simply move into event handlers.
  /* eslint-disable react-hooks/set-state-in-effect -- intentional: this effect
     consumes a dispatched swipe action (see comment above) and acknowledges the
     discrete actions by resetting to NONE; it is not syncing derived state. */
  useEffect(() => {
    if (swipeAction === SWIPE_ACTION.SWIPE_FORWARD) {
      onSwipeToIndex(1);
      setSwipeAction(SWIPE_ACTION.NONE);
    } else if (swipeAction === SWIPE_ACTION.SWIPE_BACKWARD) {
      onSwipeToIndex(-1);
      setSwipeAction(SWIPE_ACTION.NONE);
    } else if (swipeAction === SWIPE_ACTION.SELECT) {
      setSwipeAction(SWIPE_ACTION.NONE);
    }
  }, [swipeAction, onSwipeToIndex]);
  /* eslint-enable react-hooks/set-state-in-effect -- re-enable after the intentional ack effect above */

  useEffect(() => {
    if (interactiveDelay === 0) return;
    const timeout = setTimeout(() => {
      onSwipeToIndex(1);
    }, interactiveDelay);
    return (): void => clearTimeout(timeout);
  }, [activeIndex, interactiveDelay, onSwipeToIndex]);

  if (!swipeEnabled) {
    return {
      activeIndex,
      onSetActiveIndex,
      onSetSwipeAction,
    };
  }

  return {
    activeIndex,
    interactiveAction: {
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      onMouseUp,
      onTouchEnd,
      onTouchMove,
      onTouchStart,
    },
    onSetActiveIndex,
    onSetSwipeAction,
  };
}
