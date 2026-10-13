import { type DependencyList, useEffect, useRef } from "react";
import type { UseRevealLatest } from "./types";
import { revealEnd } from "./utils";

/**
 * Keeps the newest message and the composer in view on narrow screens, where
 * the page scrolls the whole chat tab rather than just its messages. Reveals
 * the end of the conversation when the dependencies change, and again whenever
 * the newest message resizes: as an assistant reply's markdown fills in a tick
 * after it mounts, and as the chat tab is shown again, so it returns to the
 * newest message. Older messages are left unwatched, so a reader scrolled up
 * through them isn't pulled down when one of them reflows. Elsewhere the
 * messages pin themselves, and this does nothing.
 * @param deps - Dependencies that change when the conversation does.
 * @returns Ref for the conversation element, whose first child is the messages.
 */
export const useRevealLatest = (deps: DependencyList): UseRevealLatest => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    revealEnd(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed in as an argument
  }, deps);

  useEffect(() => {
    const conversation = ref.current;
    const newest = conversation?.firstElementChild?.lastElementChild;
    if (!conversation || !newest || typeof ResizeObserver === "undefined")
      return;
    const observer = new ResizeObserver(() => revealEnd(conversation));
    observer.observe(newest);
    return (): void => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed in as an argument
  }, deps);

  return ref;
};
