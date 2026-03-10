import { Box, Paper, Typography } from "@mui/material";
import styled from "@emotion/styled";

export const PanelContainer = styled(Paper)({
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  overflow: "hidden",
});

export const PanelHeader = styled(Box)({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 16px",
});

export const FieldRow = styled(Box)({
  borderBottom: "1px solid #f0f0f0",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "10px 16px",
});

export const FieldValue = styled(Typography)({
  color: "#2e7d32",
  fontWeight: 500,
});
