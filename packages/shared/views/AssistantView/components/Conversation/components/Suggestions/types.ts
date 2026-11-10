import type {
  UseAssistantChatActions,
  UseAssistantChatState,
} from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
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
  UseAssistantChatState,
  "suggestions"
> {
  isBusy: boolean;
  isSetupComplete: boolean;
  onFocusComposer: () => void;
  onFocusLog: () => void;
  onSend: UseAssistantChatActions["onSendMessage"];
}
