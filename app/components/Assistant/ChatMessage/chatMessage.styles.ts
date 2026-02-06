import { Box, Paper } from "@mui/material";
import styled from "@emotion/styled";

export const MessageRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isUser",
})<{ isUser: boolean }>(({ isUser }) => ({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  justifyContent: isUser ? "flex-end" : "flex-start",
}));

const BaseBubble = styled(Paper)({
  borderRadius: "12px",
  maxWidth: "80%",
  padding: "10px 14px",
});

export const UserBubble = styled(BaseBubble)({
  backgroundColor: "#e3f2fd",
  border: "1px solid #bbdefb",
});

export const AssistantBubble = styled(BaseBubble)({
  backgroundColor: "#fff",
  border: "1px solid #e0e0e0",
});
