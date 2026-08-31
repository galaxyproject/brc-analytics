import {
  getMaxIndex,
  getOffset,
} from "@brc/views/HomeView/components/SectionWhatsNew/hooks/UseCardPaging/utils";
import {
  getContentRect,
  useResizeObserver,
} from "@databiosphere/findable-ui/lib/hooks/useResizeObserver";
import { useSwipeGesture } from "@repo/shared/hooks/UseSwipeGesture/hook";
import { useCallback, useRef, useState } from "react";
import type { UseCardPaging } from "./types";

/**
 * Pages a row of cards one card at a time, clamped at both ends so paging
 * never scrolls past the last card.
 * @param cardCount - Number of cards in the row.
 * @returns Paging state, handlers, swipe props, and the ref measuring the space
 * available.
 */
export const useCardPaging = (cardCount: number): UseCardPaging => {
  const viewportRef = useRef<HTMLDivElement>(null);
  // Content box, not border box: the viewport is padded to line the row up
  // with the content column, and counting that padding as space for cards
  // stops paging a card short of the end.
  const { width = 0 } = useResizeObserver(viewportRef, getContentRect) || {};
  const [index, setIndex] = useState(0);

  // Derived rather than stored: the widest viewport shows every card, and an
  // index kept from a narrower one would leave the row shifted past its end.
  const maxIndex = getMaxIndex(width, cardCount);
  const pageIndex = Math.min(index, maxIndex);

  // Both handlers page from the index in view rather than the stored one: a
  // wider viewport lowers the maximum, and paging from an index left behind by
  // a narrower one would spend a click going nowhere.
  const onPageBack = useCallback((): void => {
    setIndex((prev) => Math.max(0, Math.min(prev, maxIndex) - 1));
  }, [maxIndex]);

  const onPageForward = useCallback((): void => {
    setIndex((prev) => Math.min(maxIndex, Math.min(prev, maxIndex) + 1));
  }, [maxIndex]);

  // Touch only: on a pointer device the arrows page the row, and a mouse drag
  // over the cards is a text selection rather than a swipe.
  const { touchProps } = useSwipeGesture(onPageBack, onPageForward);

  return {
    canPageBack: pageIndex > 0,
    canPageForward: pageIndex < maxIndex,
    offset: getOffset(pageIndex, width, cardCount),
    onPageBack,
    onPageForward,
    swipeProps: touchProps,
    viewportRef,
  };
};
