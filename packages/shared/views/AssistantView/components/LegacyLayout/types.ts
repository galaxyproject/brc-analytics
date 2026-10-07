import { type ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { type ReactNode } from "react";

/**
 * Actions and disclaimer the legacy layout places above and below the chat.
 */
export interface LegacyHistoryProps {
  disclaimer: ReactNode;
  feedbackButton: ReactNode;
  newConversationButton: ReactNode;
}

/**
 * Props for the legacy assistant layout.
 */
export interface LegacyLayoutProps {
  slotProps: LegacyLayoutSlotProps;
}

/**
 * Props for each slot of the legacy layout. The actions and disclaimer sit
 * around the chat and setup panels rather than in a sidebar.
 */
export interface LegacyLayoutSlotProps {
  chat: ChildrenProps;
  history: LegacyHistoryProps;
  setup: ChildrenProps;
}
