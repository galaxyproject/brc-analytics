import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  CircularProgress,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import type { ChatHistoryProps } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/types";
import { Fragment, type JSX } from "react";
import { StyledList } from "./historyList.styles";
import { useChatHistory } from "./hooks/UseChatHistory/hook";

/**
 * Renders the signed-in user's saved conversations, newest first, with
 * the one open in the chat highlighted. Selecting another opens it in the chat.
 * A failed load or open is reported above the list rather than in place of it,
 * so the list stays usable to try again. Renders nothing until the user has a
 * saved conversation.
 * @param props - Component props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.lastSave - Most recent confirmed save, naming the session saved.
 * @param props.onOpeningChange - Reports whether a conversation is opening from the history.
 * @param props.onRetryRestore - Restores the conversation the URL names again, after a failed load.
 * @param props.sessionId - Session of the conversation on screen, or null while none is.
 * @returns The chat history list element, or null when there is nothing to show.
 */
export const HistoryList = (props: ChatHistoryProps): JSX.Element | null => {
  const { disabled } = props;
  const { error, isInitialLoading, items } = useChatHistory(props);

  if (isInitialLoading)
    return <CircularProgress aria-label="Loading chat history" size={16} />;

  if (!error && items.length === 0) return null;

  return (
    <Fragment>
      {error && (
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.ERROR}
          role="alert"
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          {error}
        </Typography>
      )}
      {items.length > 0 && (
        <StyledList disablePadding>
          {items.map(({ id, onOpen, selected, title }) => (
            <ListItem disablePadding key={id}>
              <ListItemButton
                aria-current={selected ? "true" : undefined}
                disabled={disabled}
                onClick={onOpen}
                selected={selected}
              >
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
                  noWrap
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
                >
                  {title}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </StyledList>
      )}
    </Fragment>
  );
};
