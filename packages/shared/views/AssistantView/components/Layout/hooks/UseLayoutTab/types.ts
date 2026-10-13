import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import type { SyntheticEvent } from "react";

/**
 * The page's scroll position for each tab, as last left.
 */
export type ScrollPositions = Partial<Record<LayoutTab, number>>;

export interface UseLayoutTab {
  onTabChange: (event: SyntheticEvent, tab: LayoutTab) => void;
  tab: LayoutTab;
}
