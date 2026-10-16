import type { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import type { HTMLAttributes, ReactNode } from "react";
import type { LAYOUT_TAB } from "./constants";

/**
 * Props for a column of the assistant layout.
 */
export interface ColumnProps extends ChildrenProps, TabPanelProps {
  active: boolean;
}

/**
 * Props for the assistant-ui layout.
 */
export interface LayoutProps {
  conversationKey: number;
  slotProps: LayoutSlotProps;
}

/**
 * Content for one column of the assistant layout, and its tab's label on
 * narrow screens.
 */
export interface LayoutSlot extends ChildrenProps {
  tabLabel: ReactNode;
}

/**
 * Content for each column of the assistant layout, keyed by column.
 */
export interface LayoutSlotProps {
  chat: LayoutSlot;
  history: LayoutSlot;
  setup: LayoutSlot;
}

/**
 * A column of the assistant layout, shown one at a time as tabs on narrow
 * screens.
 */
export type LayoutTab = (typeof LAYOUT_TAB)[keyof typeof LAYOUT_TAB];

/**
 * Switches the column shown while the columns are tabbed.
 */
export type SelectTab = (tab: LayoutTab) => void;

/**
 * Attributes that tie a column to its tab while the columns are tabbed.
 */
export type TabPanelProps = Pick<
  HTMLAttributes<HTMLElement>,
  "aria-labelledby" | "id" | "role"
>;
