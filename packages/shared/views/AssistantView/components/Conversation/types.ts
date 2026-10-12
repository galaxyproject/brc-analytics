import type { UseAssistantChatReturn } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface ConversationProps extends Pick<
  UseAssistantChatReturn,
  "error" | "isRestoring" | "loading" | "messages" | "onRetry" | "suggestions"
> {
  introText: string;
  onSend: (message: string) => void;
}
