import { Box, Typography } from "@mui/material";
import { JSX } from "react";
import { AssistantBubble, MessageRow, UserBubble } from "./chatMessage.styles";
import { MarkdownContent } from "./markdownContent";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
}

/**
 * Renders a single chat message bubble.
 * @param props - Component props
 * @param props.content - Message text content
 * @param props.role - Whether the message is from user or assistant
 * @returns Chat message element
 */
export const ChatMessage = ({
  content,
  role,
}: ChatMessageProps): JSX.Element => {
  const isUser = role === "user";
  const Bubble = isUser ? UserBubble : AssistantBubble;

  return (
    <MessageRow isUser={isUser}>
      {!isUser && (
        <Box
          alt="BRC Analytics"
          component="img"
          src="/logo/brc.svg"
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
