import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

export const StyledRoundedPaper = styled(RoundedPaper)`
  width: 100%;

  .MuiTableContainer-root {
    background-color: ${PALETTE.SMOKE_MAIN};
  }
`;

export const StyledStack = styled(Stack)`
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px;
`;
