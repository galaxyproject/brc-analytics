import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Alert, Button } from "@mui/material";
import { type JSX } from "react";
import { Composer } from "./components/Composer/composer";
import { Messages } from "./components/Messages/messages";
import { Suggestions } from "./components/Suggestions/suggestions";
import { StyledStack } from "./conversation.styles";
import { useComposerFocus } from "./hooks/UseComposerFocus/hook";
import type { ConversationProps } from "./types";

/**
 * Renders the conversation with the assistant: its messages, any error from
 * the last request, suggested next steps and the composer. The error sits outside
 * the messages' log, so only its own alert announces it, and it stays in view
 * above the composer. Signing in to keep the conversation is offered by the
 * sidebar, so it isn't repeated here.
 * @param props - Component props.
 * @param props.error - Error from the last request, if any.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.messages - Messages in the conversation.
 * @param props.onRetry - Retries the last failed request.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.suggestions - Suggested next steps.
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
  const { inputRef, onFocusComposer } = useComposerFocus();
  return (
    <StyledStack>
      <Messages
        error={error}
        introText={introText}
        isRestoring={isRestoring}
        loading={loading}
        messages={messages}
      />
      {error && (
        <Alert
          {...ALERT_PROPS.STANDARD_ERROR}
          action={
            onRetry && (
              <Button onClick={onRetry} size={BUTTON_PROPS.SIZE.SMALL}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}
      <Suggestions
        disabled={disabled}
        onFocusComposer={onFocusComposer}
        onSend={onSend}
        suggestions={suggestions}
      />
      <Composer
        disabled={disabled}
        hasMessages={messages.length > 0}
        inputRef={inputRef}
        onSend={onSend}
      />
    </StyledStack>
  );
};
