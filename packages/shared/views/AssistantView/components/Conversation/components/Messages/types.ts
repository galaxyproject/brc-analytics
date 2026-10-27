import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";
import type { RefObject } from "react";

export interface MessagesProps extends Pick<
  ConversationProps,
  "introText" | "isRestoring" | "loading" | "messages"
> {
  logRef: RefObject<HTMLDivElement | null>;
}
