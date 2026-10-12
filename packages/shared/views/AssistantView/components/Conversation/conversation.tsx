import { SuggestionChips } from "@repo/shared/views/AssistantView/components/SuggestionChips/suggestionChips";
import { type JSX } from "react";
import { Composer } from "./components/Composer/composer";
import { Messages } from "./components/Messages/messages";
import { StyledStack } from "./conversation.styles";
import type { ConversationProps } from "./types";

/**
 * Renders the conversation with the assistant: its messages, suggested
 * replies and the composer. Signing in to keep the conversation is offered by
 * the sidebar, so it isn't repeated here.
 * @param props - Component props.
 * @param props.error - Error from the last request, if any.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.messages - Messages in the conversation.
 * @param props.onRetry - Retries the last failed request.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.suggestions - Suggested replies.
 * @returns The conversation element.
 */
export const Conversation = ({
  error,
  introText,
  isRestoring,
  loading,
  messages,
  onRetry,
  onSend,
  suggestions,
}: ConversationProps): JSX.Element => {
  const disabled = loading || isRestoring;
  return (
    <StyledStack>
      <Messages
        error={error}
        introText={introText}
        isRestoring={isRestoring}
        loading={loading}
        messages={messages}
        onRetry={onRetry}
      />
      <SuggestionChips
        chips={suggestions}
        disabled={disabled}
        onSelect={onSend}
      />
      <Composer
        disabled={disabled}
        hasMessages={messages.length > 0}
        onSend={onSend}
      />
    </StyledStack>
  );
};
