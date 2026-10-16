import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";
import type { MouseEvent } from "react";

export interface StyledStackProps {
  isSetupComplete: boolean;
}

/**
 * A suggested next step as the suggestions list renders it.
 */
export interface SuggestionItem {
  description?: string;
  key: string;
  label: string;
  onSelect: (event: MouseEvent<HTMLElement>) => void;
}

export interface SuggestionsProps extends Pick<
  ConversationProps,
  "onSend" | "suggestions"
> {
  disabled: boolean;
  isSetupComplete: boolean;
  onFocusComposer: () => void;
}
