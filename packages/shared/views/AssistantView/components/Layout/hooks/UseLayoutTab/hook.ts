import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import {
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ScrollPositions, UseLayoutTab } from "./types";
import { restoreScroll, saveScroll } from "./utils";

/**
 * Tracks which column shows while the columns are tabbed, starting on the
 * chat. Moving to a different conversation, by starting a new analysis or
 * opening one from the history, brings the chat back, so the user sees the
 * conversation they chose. The tabs share the page's scroll, so switching tab
 * keeps the position of the tab left and restores the one returned to, or
 * starts it at the top. Positions belong to the conversation they were left
 * in, so a different conversation starts afresh. The chat brings its newest
 * message into view itself.
 * @param conversationKey - Key that changes when the user moves to a different conversation.
 * @returns The column showing, and a handler that switches column.
 */
export const useLayoutTab = (conversationKey: number): UseLayoutTab => {
  const [tab, setTab] = useState<LayoutTab>(LAYOUT_TAB.CHAT);
  const [shownKey, setShownKey] = useState(conversationKey);
  const scrollPositions = useRef<ScrollPositions>({});
  const shownTab = useRef(tab);

  // Adjusted while rendering rather than in an effect, so the chat shows in
  // the same render as the new conversation.
  if (conversationKey !== shownKey) {
    setShownKey(conversationKey);
    setTab(LAYOUT_TAB.CHAT);
  }

  const onTabChange = useCallback(
    (_event: SyntheticEvent, nextTab: LayoutTab): void => {
      saveScroll(scrollPositions.current, tab);
      setTab(nextTab);
    },
    [tab]
  );

  // Declared before the restore below, so it runs first when both change.
  useLayoutEffect(() => {
    scrollPositions.current = {};
  }, [conversationKey]);

  // Before paint, so the new tab never shows at the old one's position. Only
  // on a switch, leaving the page where the browser put it on arrival.
  useLayoutEffect(() => {
    if (shownTab.current === tab) return;
    shownTab.current = tab;
    restoreScroll(scrollPositions.current, tab);
  }, [tab]);

  return { onTabChange, tab };
};
