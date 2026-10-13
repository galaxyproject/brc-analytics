import type { UseAssistantChatReturn } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface ConversationProps extends Pick<
  UseAssistantChatReturn,
  | "error"
  | "handoffUrl"
  | "isRestoring"
  | "loading"
  | "messages"
  | "onRetry"
  | "schema"
  | "suggestions"
> {
  introText: string;
  onSend: (message: string) => void;
}
