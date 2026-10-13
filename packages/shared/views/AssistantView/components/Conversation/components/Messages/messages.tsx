import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { useScroll } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Messages/hooks/UseScroll/hook";
import { Typography } from "@mui/material";
import { Status } from "@repo/shared/views/AssistantView/components/Conversation/components/Status/status";
import { Fragment, type JSX } from "react";
import { ARIA_LABEL, SENDER_LABEL, STATUS_LABEL } from "./constants";
import { StyledSenderLabel, StyledStack } from "./messages.styles";
import { MessageSelector } from "./selector/messageSelector";
import type { MessagesProps } from "./types";

/**
 * Renders the conversation's messages, delegating each to the message
 * selector, with the welcome text before the first message and the
 * assistant's status -- restoring or replying -- after the last, where the
 * pinned list keeps it in view. The list is a log, so screen readers
 * announce each new message and status as it arrives. Where it scrolls on its
 * own, it keeps itself scrolled to the newest and takes focus so keyboard
 * users can scroll back; on narrow screens the page scrolls it instead.
 * Each message is preceded by its sender, hidden from view but read out by
 * screen readers, since the sender is otherwise told apart only by styling.
 * @param props - Component props.
 * @param props.error - Error from the last request, if any. Shown beneath the
 * list, where it shortens it, so the list re-pins to the newest when it appears.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.messages - Messages in the conversation.
 * @returns The messages list element.
 */
export const Messages = ({
  error,
  introText,
  isRestoring,
  loading,
  messages,
}: MessagesProps): JSX.Element => {
  const ref = useScroll([error, isRestoring, loading, messages]);
  return (
    <StyledStack
      aria-label={ARIA_LABEL.MESSAGES}
      ref={ref}
      role="log"
      tabIndex={0}
    >
      {!isRestoring && messages.length === 0 && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {introText}
        </Typography>
      )}
      {messages.map((message, i) => (
        <Fragment key={i}>
          <StyledSenderLabel>{SENDER_LABEL[message.role]}</StyledSenderLabel>
          <MessageSelector message={message} />
        </Fragment>
      ))}
      {isRestoring && <Status label={STATUS_LABEL.RESTORING} />}
      {loading && <Status label={STATUS_LABEL.LOADING} />}
    </StyledStack>
  );
};
