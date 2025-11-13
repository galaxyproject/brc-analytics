import { Box, Paper } from "@mui/material";
import styled from "@emotion/styled";

export const SearchContainer = styled(Box)({
  margin: "0 auto",
  maxWidth: "1200px",
  padding: "0 16px",
});

export const SearchFormContainer = styled(Box)({
  marginBottom: "24px",
});

export const SearchForm = styled(Box)({
  "@media (min-width: 768px)": {
    flexDirection: "row",
  },
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
});

export const SearchHelperText = styled(Box)({
  marginTop: "8px",
});

export const ResultsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

export const WorkflowCard = styled(Paper)({
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "20px",
});
