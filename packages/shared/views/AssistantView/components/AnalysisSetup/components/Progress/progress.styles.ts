import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { LinearProgress } from "@mui/material";

export const StyledLinearProgress = styled(LinearProgress)`
  background-color: ${PALETTE.SMOKE_MAIN};
  border-radius: 1px;
  height: 2px;
  margin: 8px 0;

  .MuiLinearProgress-bar {
    border-radius: inherit;
  }
`;
