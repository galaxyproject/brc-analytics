import { ButtonBase, Paper } from "@mui/material";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledPaper = styled(Paper)`
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  border: 1px dashed ${PALETTE.SMOKE_MAIN};
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
`;
