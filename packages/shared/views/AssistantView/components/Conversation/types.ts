import type {
  UseAssistantChatActions,
  UseAssistantChatState,
} from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface ConversationProps {
  actions: UseAssistantChatActions;
  introText: string;
  state: UseAssistantChatState;
}
