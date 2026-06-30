import {
  MouseEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_ACTIVE_INDEX,
  DEFAULT_SWIPE_COORDINATES,
} from "./common/constants";
import { SWIPE_ACTION, SwipeAction, SwipeCoordinates } from "./common/entities";

export interface InteractiveAction {
  onMouseDown: (mouseEvent: MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseUp: (mouseEvent: MouseEvent) => void;
  onTouchEnd: (touchEvent: TouchEvent) => void;
  onTouchMove: (touchEvent: TouchEvent) => void;
  onTouchStart: (touchEvent: TouchEvent) => void;
}

export interface UseSwipeInteraction {
  activeIndex: number;
  interactiveAction?: InteractiveAction;
  onSetActiveIndex: (newIndex: number) => void;
  onSetSwipeAction: (newSwipeAction: SwipeAction) => void;
}

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

  useEffect(() => {
    if (swipeAction === SWIPE_ACTION.SWIPE_FORWARD) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- swipe state-machine resets action after handling; refactor tracked in #1393
      onSwipeToIndex(1);
      setSwipeAction(SWIPE_ACTION.NONE);
    } else if (swipeAction === SWIPE_ACTION.SWIPE_BACKWARD) {
      onSwipeToIndex(-1);
      setSwipeAction(SWIPE_ACTION.NONE);
    } else if (swipeAction === SWIPE_ACTION.SELECT) {
      setSwipeAction(SWIPE_ACTION.NONE);
    }
  }, [swipeAction, onSwipeToIndex]);

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

/**
 * Returns swipe action, calculated from swipe interaction start and end coordinates.
 * @param startCoords - Swipe start coordinates (mouse or touch).
 * @param endCoords - Swipe end coordinates (mouse or touch).
 * @returns swipe action.
 */
function calculateSwipeAction(
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
function getMouseCoords(mouseEvent: MouseEvent): SwipeCoordinates {
  const x = mouseEvent.clientX;
  const y = mouseEvent.clientY;
  return { x, y };
}

/**
 * Returns the touch event clientX and clientY coordinates.
 * @param touchEvent - Touch event.
 * @returns x and y touch event coordinates.
 */
function getTouchCoords(touchEvent: TouchEvent): SwipeCoordinates {
  const x = changedTouches(touchEvent).clientX;
  const y = changedTouches(touchEvent).clientY;
  return { x, y };
}
