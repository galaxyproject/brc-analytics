import { Box, Typography } from "@mui/material";
import type { ChatMessageRole } from "@repo/shared/services/api-client/types";
import { type JSX } from "react";
import { AssistantBubble, MessageRow, UserBubble } from "./chatMessage.styles";
import { MarkdownContent } from "./markdownContent";

interface ChatMessageProps {
  content: string;
  role: ChatMessageRole;
}

/**
 * Renders a single chat message bubble, or the app's own note (such as a field
 * cleared from the setup panel) as a plain centred line, so it doesn't read as
 * something either side said.
 * @param props - Component props
 * @param props.content - Message text content
 * @param props.role - Whether the message is from user, assistant, or the app
 * @returns Chat message element
 */
export const ChatMessage = ({
  content,
  role,
}: ChatMessageProps): JSX.Element => {
  if (role === "system") {
    return (
      <Typography
        color="text.secondary"
        component="div"
        sx={{ textAlign: "center" }}
        variant="body2"
      >
        {content}
      </Typography>
    );
  }

  const isUser = role === "user";
  const Bubble = isUser ? UserBubble : AssistantBubble;

  return (
    <MessageRow isUser={isUser}>
      {!isUser && (
        <Box
          alt="Assistant"
          component="img"
          src="/logo/assistant.svg"
          sx={{
            flexShrink: 0,
            height: 20,
            marginTop: "6px",
            width: "auto",
          }}
        />
      )}
      <Bubble>
        {isUser ? (
          <Typography
            component="div"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            variant="body2"
          >
            {content}
          </Typography>
        ) : (
          <Box
            sx={{
              "& h1, & h2, & h3, & h4": {
                fontSize: "1em",
                fontWeight: 600,
                margin: "12px 0 4px",
              },
              "& p": { margin: "4px 0" },
              "& table": {
                borderCollapse: "collapse",
                fontSize: "0.85em",
                margin: "8px 0",
                width: "100%",
              },
              "& td, & th": {
                border: "1px solid #ddd",
                padding: "4px 8px",
                textAlign: "left",
              },
              "& th": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
              },
              "& ul, & ol": {
                margin: "4px 0",
                paddingLeft: "20px",
              },
              fontSize: "0.875rem",
              lineHeight: 1.6,
              wordBreak: "break-word",
            }}
          >
            <MarkdownContent content={content} />
          </Box>
        )}
      </Bubble>
    </MessageRow>
  );
};
