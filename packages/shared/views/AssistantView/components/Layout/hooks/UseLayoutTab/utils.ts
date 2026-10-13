import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import type { ScrollPositions } from "./types";

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
