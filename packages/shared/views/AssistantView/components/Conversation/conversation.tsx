import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { Alert, Button } from "@mui/material";
import { type JSX } from "react";
import { Completion } from "./components/Completion/completion";
import { Composer } from "./components/Composer/composer";
import { Messages } from "./components/Messages/messages";
import { Suggestions } from "./components/Suggestions/suggestions";
import { StyledEnd, StyledFooter, StyledStack } from "./conversation.styles";
import { useComposerFocus } from "./hooks/UseComposerFocus/hook";
import { useFooterClearance } from "./hooks/UseFooterClearance/hook";
import { useLogFocus } from "./hooks/UseLogFocus/hook";
import { useRevealLatest } from "./hooks/UseRevealLatest/hook";
import type { ConversationProps } from "./types";

/**
 * Renders the conversation with the assistant: its messages, the handoff once
 * the setup is complete (on narrow screens only), suggested next steps, any
 * error from the last request and the composer. The suggestions and the error
 * sit outside the messages' log, so neither is read out as part of a reply.
 * Signing in to keep the conversation is offered by the sidebar, so it isn't
 * repeated here. The conversation keeps its newest message in view. On wider
 * screens the chat column scrolls it, with the suggestions following the
 * messages, and the error and composer stay pinned to the column's foot,
 * with what the column brings into view kept clear of them; on narrow
 * screens the whole chat tab scrolls, composer included.
 * @param props - Component props.
 * @param props.error - Error from the last request, if any.
 * @param props.handoffUrl - Workflow setup URL, or null until the setup is complete.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.messages - Messages in the conversation.
 * @param props.onRetry - Retries the last failed request.
 * @param props.onSend - Sends a message to the assistant.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @param props.suggestions - Suggested next steps.
 * @returns The conversation element.
 */
export const Conversation = ({
  error,
  handoffUrl,
  introText,
  isRestoring,
  loading,
  messages,
  onRetry,
  onSend,
  schema,
  suggestions,
}: ConversationProps): JSX.Element => {
  const disabled = loading || isRestoring;
  const { inputRef, onFocusComposer } = useComposerFocus();
  const { logRef, onFocusLog } = useLogFocus();
  const ref = useRevealLatest([error, isRestoring, loading, messages]);
  const { ref: footerRef } = useFooterClearance();
  return (
    <StyledStack ref={ref}>
      <Messages
        introText={introText}
        isRestoring={isRestoring}
        loading={loading}
        logRef={logRef}
        messages={messages}
      />
      <Completion disabled={disabled} handoffUrl={handoffUrl} schema={schema} />
      <StyledEnd>
        <Suggestions
          isBusy={disabled}
          isSetupComplete={Boolean(handoffUrl)}
          onFocusComposer={onFocusComposer}
          onFocusLog={onFocusLog}
          onSend={onSend}
          suggestions={suggestions}
        />
        <StyledFooter ref={footerRef}>
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
          <Composer
            disabled={disabled}
            hasMessages={messages.length > 0}
            inputRef={inputRef}
            onSend={onSend}
          />
        </StyledFooter>
      </StyledEnd>
    </StyledStack>
  );
};
