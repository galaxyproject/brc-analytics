import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";
import type { UseAssistantChatState } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import type { RefObject } from "react";

export interface MessagesProps
  extends
    Pick<ConversationProps, "introText">,
    Pick<UseAssistantChatState, "isRestoring" | "loading" | "messages"> {
  logRef: RefObject<HTMLDivElement | null>;
}
