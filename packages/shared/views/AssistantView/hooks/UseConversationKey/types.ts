import type { UseAssistantChatActions } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface UseConversationKey {
  conversationKey: number;
  onNewAnalysis: () => void;
  onOpenConversation: UseAssistantChatActions["onOpenConversation"];
}

export type UseConversationKeyActions = Pick<
  UseAssistantChatActions,
  "onOpenConversation" | "onResetSession"
>;
