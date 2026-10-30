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
