import { type JSX } from "react";
import { StyledMarkdownRenderer } from "./assistantMessage.styles";
import { COMPONENTS } from "./constants";
import type { AssistantMessageProps } from "./types";

/**
 * Renders a message from the assistant as plain markdown text, with no bubble
 * or label around it.
 * @param props - Component props.
 * @param props.message - Assistant message.
 * @returns The assistant message element.
 */
export const AssistantMessage = ({
  message,
}: AssistantMessageProps): JSX.Element => {
  return (
    <StyledMarkdownRenderer components={COMPONENTS} value={message.content} />
  );
};
