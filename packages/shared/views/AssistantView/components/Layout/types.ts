import type { Props as ChatProps } from "./components/Chat/types";
import type { Props as HistoryProps } from "./components/History/types";
import type { Props as SetupProps } from "./components/Setup/types";

/**
 * Props for the assistant-ui layout.
 */
export interface LayoutProps {
  slotProps: LayoutSlotProps;
}

/**
 * Props for each column of the assistant layout, keyed by column.
 */
export interface LayoutSlotProps {
  chat: ChatProps;
  history: HistoryProps;
  setup: SetupProps;
}
