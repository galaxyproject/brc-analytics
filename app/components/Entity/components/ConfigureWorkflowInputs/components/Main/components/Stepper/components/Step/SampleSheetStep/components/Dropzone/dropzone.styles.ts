import { ButtonBase, Paper } from "@mui/material";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

interface StyledPaperProps {
  isDragActive?: boolean;
}

export const StyledPaper = styled(Paper)<StyledPaperProps>`
  background-color: ${({ isDragActive }) =>
    isDragActive ? PALETTE.PRIMARY_LIGHTEST : PALETTE.SMOKE_LIGHTEST};
  border: 1px dashed
    ${({ isDragActive }) =>
      isDragActive ? PALETTE.PRIMARY_MAIN : PALETTE.SMOKE_MAIN};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
`;

export const StyledButtonBase = styled(ButtonBase)`
  cursor: pointer;
  display: grid;
  gap: 16px;
  justify-items: center;
  padding: 24px;
  width: 100%;

  .MuiSvgIcon-root {
    font-size: 72px;
  }

  .MuiStack-root {
    min-width: 0;
    width: 100%;
  }
`;
