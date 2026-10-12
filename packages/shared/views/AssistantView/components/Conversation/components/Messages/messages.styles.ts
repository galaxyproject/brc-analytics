import styled from "@emotion/styled";
import { Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  flex: 1;
  gap: 24px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
`;
