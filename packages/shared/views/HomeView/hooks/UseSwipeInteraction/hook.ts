import { useSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/hook";
import { useCallback, useState } from "react";
import { DEFAULT_ACTIVE_INDEX } from "./constants";
import { type UseSwipeInteraction } from "./types";

/**
 * Swipe actions over swipe-able "views" i.e. cards etc.
 * @param indexCount - Number of swipe-able / interactive "views".
 * @param swipeEnabled - Swipe interaction is enabled.
 * @returns swipe actions and active swipe index.
 */
export function useSwipeInteraction(
  indexCount: number,
  swipeEnabled = true
): UseSwipeInteraction {
  const [activeIndex, setActiveIndex] = useState<number>(DEFAULT_ACTIVE_INDEX);
  const lastIndex = indexCount - 1;

  const onSetActiveIndex = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
  }, []);

  const onSwipeToIndex = useCallback(
    (increment: number): void => {
      /* Increment index either way. */
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex + increment;
        if (newIndex < 0) {
          /* The action is a backwards swipe; */
          /* If the new index is negative, rotate to the last index. */
          return lastIndex;
        }
        if (newIndex > lastIndex) {
          /* The action is a forwards swipe. */
          /* If the new index is greater than the last possible index, rotate to the first index. */
          return 0;
        }
        return newIndex;
      });
    },
    [lastIndex]
  );

  const onSwipeBackward = useCallback((): void => {
    onSwipeToIndex(-1);
  }, [onSwipeToIndex]);

  const onSwipeForward = useCallback((): void => {
    onSwipeToIndex(1);
  }, [onSwipeToIndex]);

  const { mouseProps, touchProps } = useSwipeGesture(
    onSwipeBackward,
    onSwipeForward
  );

  if (!swipeEnabled) {
    return {
      activeIndex,
      onSetActiveIndex,
    };
  }

  return {
    activeIndex,
    interactiveAction: { ...mouseProps, ...touchProps },
    onSetActiveIndex,
  };
}
