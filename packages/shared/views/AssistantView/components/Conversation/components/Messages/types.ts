import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";

export type MessagesProps = Pick<
  ConversationProps,
  "error" | "introText" | "isRestoring" | "loading" | "messages" | "onRetry"
>;
