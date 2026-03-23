import styled from "@emotion/styled";
import { Box, Chip } from "@mui/material";

export const ChipsContainer = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "8px 12px",
});

export const SuggestionChip = styled(Chip)({
  "&:hover": {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
  },
  borderColor: "#bbdefb",
  borderRadius: "16px",
  fontSize: "0.8125rem",
  height: "auto",
  padding: "4px 2px",
  transition: "background-color 0.15s, border-color 0.15s",
});
