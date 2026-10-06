import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CircularProgress, ListItemButton, Typography } from "@mui/material";
import { type JSX, Fragment } from "react";
import { UNTITLED } from "./constants";
import { StyledList } from "./historyList.styles";
import { useChatHistory } from "./hooks/UseChatHistory/hook";
import { isActiveAnalysis } from "./hooks/UseChatHistory/utils";
import type { HistoryListProps } from "./types";

/**
 * Renders the signed-in user's saved conversations, most recent first, with
 * the one open in the chat highlighted. Selecting another opens it in the chat.
 * Renders nothing until the user has a saved conversation.
 * @param props - Component props.
 * @param props.isSaved - Whether the current conversation is saved to the user's account.
 * @param props.sessionId - Current assistant session id, or null before one is open.
 * @returns The chat history list element.
 */
export const HistoryList = ({
  isSaved,
  sessionId,
}: HistoryListProps): JSX.Element => {
  const { error, isInitialLoading, items, onOpen } = useChatHistory(
    isSaved,
    sessionId
  );

  if (isInitialLoading)
    return <CircularProgress aria-label="Loading chat history" size={16} />;

  if (error)
    return (
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.ERROR}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
      >
        {error}
      </Typography>
    );

  return (
    <Fragment>
      {items.length > 0 && (
        <StyledList disablePadding>
          {items.map((analysis) => (
            <ListItemButton
              key={analysis.id}
              onClick={() => onOpen(analysis)}
              selected={isActiveAnalysis(analysis, sessionId)}
            >
              <Typography
                color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
                noWrap
                variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
              >
                {analysis.title ?? UNTITLED}
              </Typography>
            </ListItemButton>
          ))}
        </StyledList>
      )}
    </Fragment>
  );
};
