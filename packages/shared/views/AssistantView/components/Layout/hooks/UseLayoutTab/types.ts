import type {
  LayoutTab,
  SelectTab,
} from "@repo/shared/views/AssistantView/components/Layout/types";
import type { SyntheticEvent } from "react";

/**
 * The page's scroll position for each tab, as last left.
 */
export type ScrollPositions = Partial<Record<LayoutTab, number>>;

/**
 * The column showing, and whether switching to it should move focus to its
 * tab regardless of where focus was.
 */
export interface ShownTab {
  moveFocus: boolean;
  tab: LayoutTab;
}

export interface UseLayoutTab {
  onSelectTab: SelectTab;
  onTabChange: (event: SyntheticEvent, tab: LayoutTab) => void;
  tab: LayoutTab;
}
