import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Button, Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;

  .MuiTypography-root {
    opacity: 0.8;
  }
`;

export const StyledButton = styled(Button)`
  text-transform: none;

  .MuiButton-startIcon {
    color: ${PALETTE.INK_LIGHT};
  }
` as typeof Button;
