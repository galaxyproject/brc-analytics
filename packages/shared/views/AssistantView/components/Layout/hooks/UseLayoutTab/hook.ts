import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import {
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ScrollPositions, ShownTab, UseLayoutTab } from "./types";
import { focusTab, refocusIfLeft, restoreScroll, saveScroll } from "./utils";

/**
 * Tracks which column shows while the columns are tabbed, starting on the
 * chat. Moving to a different conversation, by starting a new analysis or
 * opening one from the history, brings the chat back, so the user sees the
 * conversation they chose. The tabs share the page's scroll, so switching tab
 * keeps the position of the tab left and restores the one returned to, or
 * starts it at the top. Positions belong to the conversation they were left
 * in, so a different conversation starts afresh. The chat brings its newest
 * message into view itself.
 *
 * Focus follows the user to the tab now showing when they switched from inside
 * a column, or moved to a different conversation from another tab, since the
 * control they used is now hidden. Safari doesn't focus a control that is
 * tapped or clicked, so this doesn't wait to find focus there. A switch from
 * the tabs themselves moves focus only if it was inside the tab just left.
 * @param conversationKey - Key that changes when the user moves to a different conversation.
 * @param baseId - Id unique to the layout, naming its tabs.
 * @returns The column showing, and handlers that switch column: one for the
 * tabs, and one for content inside a column.
 */
export const useLayoutTab = (
  conversationKey: number,
  baseId: string
): UseLayoutTab => {
  const [shown, setShown] = useState<ShownTab>({
    moveFocus: false,
    tab: LAYOUT_TAB.CHAT,
  });
  const [shownKey, setShownKey] = useState(conversationKey);
  const scrollPositions = useRef<ScrollPositions>({});
  const shownTab = useRef(shown.tab);

  // Adjusted while rendering rather than in an effect, so the chat shows in
  // the same render as the new conversation.
  if (conversationKey !== shownKey) {
    setShownKey(conversationKey);
    setShown({ moveFocus: true, tab: LAYOUT_TAB.CHAT });
  }

  // Reads the tab being left from the ref, so the handler, which content
  // inside a column receives through context, stays the same between switches.
  const onSelectTab = useCallback((nextTab: LayoutTab): void => {
    saveScroll(scrollPositions.current, shownTab.current);
    setShown({ moveFocus: true, tab: nextTab });
  }, []);

  const onTabChange = useCallback(
    (_event: SyntheticEvent, nextTab: LayoutTab): void => {
      saveScroll(scrollPositions.current, shownTab.current);
      setShown({ moveFocus: false, tab: nextTab });
    },
    []
  );

  // Declared before the restore below, so it runs first when both change.
  useLayoutEffect(() => {
    scrollPositions.current = {};
  }, [conversationKey]);

  // Before paint, so the new tab never shows at the old one's position. Only
  // on a switch, leaving the page where the browser put it on arrival.
  useLayoutEffect(() => {
    const leftTab = shownTab.current;
    if (leftTab === shown.tab) return;
    shownTab.current = shown.tab;
    restoreScroll(scrollPositions.current, shown.tab);
    if (shown.moveFocus) focusTab(baseId, shown.tab);
    else refocusIfLeft(baseId, leftTab, shown.tab);
  }, [baseId, shown]);

  return { onSelectTab, onTabChange, tab: shown.tab };
};
