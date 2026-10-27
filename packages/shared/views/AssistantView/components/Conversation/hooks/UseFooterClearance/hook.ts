import { GAP } from "@repo/shared/views/AssistantView/components/Conversation/constants";
import { type RefObject, useEffect, useRef } from "react";
import type { UseFooterClearance } from "./types";
import { setFooterClearance } from "./utils";

/**
 * Measures the footer, so that whatever the chat column brings into view, such
 * as a link or suggestion focused from the keyboard, is kept clear of it where
 * it is pinned to the column's foot, on wider screens. Keeps its height, and
 * the gap it paints over, on the conversation as it grows or shrinks with an
 * error or a longer draft; the conversation's styles apply it.
 * @param conversationRef - Ref for the conversation element.
 * @returns Ref for the footer.
 */
export const useFooterClearance = (
  conversationRef: RefObject<HTMLDivElement | null>
): UseFooterClearance => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversation = conversationRef.current;
    const footer = ref.current;
    if (!conversation || !footer || typeof ResizeObserver === "undefined")
      return;
    const observer = new ResizeObserver(() =>
      setFooterClearance(conversation, footer.offsetHeight + GAP)
    );
    observer.observe(footer);
    return (): void => {
      observer.disconnect();
      setFooterClearance(conversation, null);
    };
  }, [conversationRef]);

  return ref;
};
