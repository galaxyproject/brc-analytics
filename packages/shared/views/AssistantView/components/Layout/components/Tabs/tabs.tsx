import { Tab } from "@mui/material";
import {
  getTabId,
  getTabPanelId,
} from "@repo/shared/views/AssistantView/components/Layout/utils";
import { type JSX } from "react";
import { StyledTabBar, StyledTabs } from "./tabs.styles";
import type { TabsProps } from "./types";

/**
 * Tabs that switch between the assistant's columns on narrow screens, where
 * only one shows at a time. Pinned beneath the header while the page scrolls,
 * and hidden on wider screens, where the columns sit side by side.
 * @param props - Component props.
 * @param props.baseId - Id unique to the layout, tying each tab to its column.
 * @param props.onTabChange - Switches column.
 * @param props.tabs - Tabs, one per column.
 * @param props.top - Height of the fixed header, beneath which the tabs pin.
 * @param props.value - Column showing.
 * @returns The tabs element.
 */
export const Tabs = ({
  baseId,
  onTabChange,
  tabs,
  top,
  value,
}: TabsProps): JSX.Element => {
  return (
    <StyledTabBar top={top}>
      <StyledTabs onChange={onTabChange} value={value} variant="fullWidth">
        {tabs.map(({ label, value: tab }) => (
          <Tab
            key={tab}
            aria-controls={getTabPanelId(baseId, tab)}
            id={getTabId(baseId, tab)}
            label={label}
            value={tab}
          />
        ))}
      </StyledTabs>
    </StyledTabBar>
  );
};
