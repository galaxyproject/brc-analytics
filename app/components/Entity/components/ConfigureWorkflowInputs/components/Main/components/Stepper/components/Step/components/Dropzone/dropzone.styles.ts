import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Paper } from "@mui/material";

interface StyledPaperProps {
  isDragActive?: boolean;
}

export const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isDragActive",
})<StyledPaperProps>`
  background-color: ${({ isDragActive }) =>
    isDragActive ? PALETTE.PRIMARY_LIGHTEST : PALETTE.SMOKE_LIGHTEST};
  border: 1px dashed
    ${({ isDragActive }) =>
      isDragActive ? PALETTE.PRIMARY_MAIN : PALETTE.SMOKE_MAIN};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
`;
