import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";

export interface CompletionProps extends Pick<
  ConversationProps,
  "handoffUrl" | "schema"
> {
  disabled: boolean;
}
