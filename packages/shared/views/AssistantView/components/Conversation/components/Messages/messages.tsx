import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { useScroll } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Messages/hooks/UseScroll/hook";
import { Alert, Button, Typography } from "@mui/material";
import { Status } from "@repo/shared/views/AssistantView/components/Conversation/components/Status/status";
import { type JSX } from "react";
import { ARIA_LABEL, STATUS_LABEL } from "./constants";
import { StyledStack } from "./messages.styles";
import { MessageSelector } from "./selector/messageSelector";
import type { MessagesProps } from "./types";

/**
 * Renders the conversation's messages, delegating each to the message
 * selector, with the welcome text before the first message and the
 * assistant's status and any error after the last. The list is a log, so
 * screen readers announce each new message and status as it arrives, and it
 * keeps itself scrolled to the newest.
 * @param props - Component props.
 * @param props.error - Error from the last request, if any.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.messages - Messages in the conversation.
 * @param props.onRetry - Retries the last failed request.
 * @returns The messages list element.
 */
export const Messages = ({
  error,
  introText,
  isRestoring,
  loading,
  messages,
  onRetry,
}: MessagesProps): JSX.Element => {
  const ref = useScroll([error, isRestoring, loading, messages]);
  return (
    <StyledStack aria-label={ARIA_LABEL.MESSAGES} ref={ref} role="log">
      {isRestoring && <Status label={STATUS_LABEL.RESTORING} />}
      {!isRestoring && messages.length === 0 && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {introText}
        </Typography>
      )}
      {messages.map((message, i) => (
        <MessageSelector key={i} message={message} />
      ))}
      {loading && <Status label={STATUS_LABEL.LOADING} />}
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
    </StyledStack>
  );
};
