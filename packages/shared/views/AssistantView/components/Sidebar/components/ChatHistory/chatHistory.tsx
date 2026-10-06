import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Divider } from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { Fragment, type JSX } from "react";
import { StyledTypography } from "./chatHistory.styles";
import { ChatHistorySelector } from "./selector/chatHistorySelector";
import type { ChatHistoryProps } from "./types";

/**
 * Renders the chat history section: the user's saved conversations when
 * signed in, or a prompt to sign in. Hidden where login is not enabled, since
 * conversations are only saved to an account.
 * @param props - Component props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.lastSave - Most recent confirmed save, naming the session saved.
 * @param props.onOpeningChange - Reports whether a conversation is opening from the history.
 * @param props.onRetryRestore - Restores the conversation the URL names again, after a failed load.
 * @param props.sessionId - Session of the conversation on screen, or null while none is.
 * @returns The chat history section element, or null when login is not enabled.
 */
export const ChatHistory = ({
  disabled,
  lastSave,
  onOpeningChange,
  onRetryRestore,
  sessionId,
}: ChatHistoryProps): JSX.Element | null => {
  const { isConfigured } = useAuth();
  if (!isConfigured) return null;
  return (
    <Fragment>
      <Divider />
      <div>
        <StyledTypography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          component="h2"
          variant={TYPOGRAPHY_PROPS.VARIANT.UPPERCASE_500}
        >
          Chat history
        </StyledTypography>
        <ChatHistorySelector
          disabled={disabled}
          lastSave={lastSave}
          onOpeningChange={onOpeningChange}
          onRetryRestore={onRetryRestore}
          sessionId={sessionId}
        />
      </div>
    </Fragment>
  );
};
