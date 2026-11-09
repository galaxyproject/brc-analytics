import type {
  UseAssistantChatActions,
  UseAssistantChatState,
} from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface ConversationProps
  extends
    Pick<UseAssistantChatActions, "onRetry">,
    Pick<
      UseAssistantChatState,
      | "error"
      | "handoffUrl"
      | "isRestoring"
      | "loading"
      | "messages"
      | "schema"
      | "suggestions"
    > {
  introText: string;
  onSend: UseAssistantChatActions["onSendMessage"];
}
