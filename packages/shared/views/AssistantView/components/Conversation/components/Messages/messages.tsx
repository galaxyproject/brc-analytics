import {
  BREAKPOINT_FN_NAME,
  useBreakpointHelper,
} from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
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
 * assistant's status -- restoring or replying -- after the last. The list is
 * a log, so screen readers announce each new message and status as it
 * arrives. On wider screens the chat column scrolls it, and the list takes
 * focus so keyboard users can scroll back through it; on narrow screens the
 * page scrolls it instead, so it isn't a tab stop. Either way it can be
 * focused from script, so focus has somewhere to go when the control it was
 * on goes.
 * Each message is preceded by its sender, hidden from view but read out by
 * screen readers, since the sender is otherwise told apart only by styling.
 * @param props - Component props.
 * @param props.introText - Welcome text shown before any messages.
 * @param props.isRestoring - Whether a conversation is being restored or opened.
 * @param props.loading - Whether a reply to the last message is in flight.
 * @param props.logRef - Ref to the list, so focus can be moved to it.
 * @param props.messages - Messages in the conversation.
 * @returns The messages list element.
 */
export const Messages = ({
  introText,
  isRestoring,
  loading,
  logRef,
  messages,
}: MessagesProps): JSX.Element => {
  const isNarrow = useBreakpointHelper(BREAKPOINT_FN_NAME.DOWN, "md");
  return (
    <StyledStack
      aria-label={ARIA_LABEL.MESSAGES}
      ref={logRef}
      role="log"
      tabIndex={isNarrow ? -1 : 0}
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
