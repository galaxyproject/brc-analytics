import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";

export interface ComposerProps extends Pick<ConversationProps, "onSend"> {
  disabled: boolean;
  hasMessages: boolean;
}
