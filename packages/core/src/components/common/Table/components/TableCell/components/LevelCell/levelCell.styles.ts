import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Box } from "@mui/material";

export const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "filled",
})<{ filled: boolean }>`
  background-color: ${({ filled }) =>
    filled ? PALETTE.PRIMARY_MAIN : PALETTE.SMOKE_DARK};
  border-radius: 1px;
  height: 12px;
  width: 5px;
`;
