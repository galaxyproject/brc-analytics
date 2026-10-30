import type { Tab } from "./components/Tabs/types";
import { LAYOUT_TAB } from "./constants";
import type { LayoutSlotProps, LayoutTab, TabPanelProps } from "./types";

/**
 * Builds the tabs for the columns, in display order.
 * @param slotProps - Content for each column.
 * @returns Tabs, one per column.
 */
export function buildTabs(slotProps: LayoutSlotProps): Tab[] {
  return [
    { label: slotProps.history.tabLabel, value: LAYOUT_TAB.HISTORY },
    { label: slotProps.chat.tabLabel, value: LAYOUT_TAB.CHAT },
    { label: slotProps.setup.tabLabel, value: LAYOUT_TAB.SETUP },
  ];
}

/**
 * Id of a column's tab.
 * @param baseId - Id unique to the layout.
 * @param tab - Column.
 * @returns Tab id.
 */
export function getTabId(baseId: string, tab: LayoutTab): string {
  return `${baseId}-tab-${tab}`;
}

/**
 * Id of a column, the panel its tab controls.
 * @param baseId - Id unique to the layout.
 * @param tab - Column.
 * @returns Panel id.
 */
export function getTabPanelId(baseId: string, tab: LayoutTab): string {
  return `${baseId}-panel-${tab}`;
}

/**
 * Attributes for a column. While the columns are tabbed, it is the panel its
 * tab controls; side by side, it is a plain column.
 * @param baseId - Id unique to the layout.
 * @param tab - Column.
 * @param isTabbed - Whether the columns are shown as tabs.
 * @returns Column attributes.
 */
export function getTabPanelProps(
  baseId: string,
  tab: LayoutTab,
  isTabbed: boolean
): TabPanelProps {
  const id = getTabPanelId(baseId, tab);
  if (!isTabbed) return { id };
  return { "aria-labelledby": getTabId(baseId, tab), id, role: "tabpanel" };
}
