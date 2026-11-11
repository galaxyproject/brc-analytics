import type { UseAssistantChatState } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";

export interface CompletionProps extends Pick<
  UseAssistantChatState,
  "handoffUrl" | "schema"
> {
  disabled: boolean;
}
