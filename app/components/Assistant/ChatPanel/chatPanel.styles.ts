import { Box } from "@mui/material";
import styled from "@emotion/styled";

export const ChatContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
});

export const MessagesContainer = styled(Box)({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "16px",
});

export const InputRow = styled(Box)({
  alignItems: "flex-end",
  borderTop: "1px solid #e0e0e0",
  display: "flex",
  gap: "8px",
  padding: "12px 16px",
});
