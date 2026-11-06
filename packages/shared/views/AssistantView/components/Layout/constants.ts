/**
 * The assistant layout's columns, shown one at a time as tabs on narrow
 * screens.
 */
export const LAYOUT_TAB = {
  CHAT: "chat",
  HISTORY: "history",
  SETUP: "setup",
} as const;

/**
 * Accessible name of the tabs that switch between the columns.
 */
export const TABS_LABEL = "Assistant sections";

/**
 * Height of the pinned tab bar with one-line tab labels: 16px padding either
 * side of the segmented control's 2px track and tab. Used only until the bar
 * is measured.
 */
export const TAB_BAR_HEIGHT = 68;

/**
 * Custom property on the html element holding the pinned tab bar's measured
 * height.
 */
export const TAB_BAR_HEIGHT_PROPERTY = "--assistant-tab-bar-height";
