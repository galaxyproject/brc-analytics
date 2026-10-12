import { AssistantMessage } from "@repo/shared/views/AssistantView/components/Conversation/components/Messages/components/AssistantMessage/assistantMessage";
import { UserMessage } from "@repo/shared/views/AssistantView/components/Conversation/components/Messages/components/UserMessage/userMessage";
import { MESSAGE_ROLE } from "@repo/shared/views/AssistantView/constants";
import { type JSX } from "react";
import type { MessageSelectorProps } from "./types";

/**
 * Selects and renders the message component for whoever sent the message.
 *
 * Available roles:
 * - `ASSISTANT`: Displays the assistant's reply as markdown.
 * - `USER`: Displays the user's message as a pill.
 *
 * @param props - Component props.
 * @param props.message - Chat message.
 * @returns The selected message component.
 */
export const MessageSelector = ({
  message,
}: MessageSelectorProps): JSX.Element => {
  switch (message.role) {
    case MESSAGE_ROLE.ASSISTANT:
      return <AssistantMessage message={message} />;
    case MESSAGE_ROLE.USER:
      return <UserMessage message={message} />;
  }
};
