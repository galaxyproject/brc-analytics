import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import {
  getTabId,
  getTabPanelId,
} from "@repo/shared/views/AssistantView/components/Layout/utils";
import type { ScrollPositions } from "./types";

/**
 * Moves focus to a tab, without scrolling it into view. Does nothing while the
 * tabs are hidden on wider screens.
 * @param baseId - Id unique to the layout.
 * @param tab - Tab to focus.
 */
export function focusTab(baseId: string, tab: LayoutTab): void {
  document
    .getElementById(getTabId(baseId, tab))
    ?.focus({ preventScroll: true });
}

/**
 * Moves focus to a tab when it was inside the tab just left, which is now
 * hidden, as when a conversation opened from the history brings the chat back.
 * Focus anywhere else, such as on the tab just clicked, is left alone.
 * @param baseId - Id unique to the layout.
 * @param leftTab - Tab just left.
 * @param tab - Tab now showing.
 */
export function refocusIfLeft(
  baseId: string,
  leftTab: LayoutTab,
  tab: LayoutTab
): void {
  const leftPanel = document.getElementById(getTabPanelId(baseId, leftTab));
  if (!leftPanel?.contains(document.activeElement)) return;
  document
    .getElementById(getTabId(baseId, tab))
    ?.focus({ preventScroll: true });
}

/**
 * Scrolls the page back to where a tab was last left, or to the top.
 * @param positions - Each tab's scroll position, as last left.
 * @param tab - Tab now showing.
 */
export function restoreScroll(
  positions: ScrollPositions,
  tab: LayoutTab
): void {
  window.scrollTo({ top: positions[tab] ?? 0 });
}

/**
 * Records where the page is scrolled, as the tab is left.
 * @param positions - Each tab's scroll position, as last left.
 * @param tab - Tab being left.
 */
export function saveScroll(positions: ScrollPositions, tab: LayoutTab): void {
  positions[tab] = window.scrollY;
}
