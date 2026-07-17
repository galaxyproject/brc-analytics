import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Grid } from "@mui/material";

export const StyledGrid = styled(Grid)`
  align-content: flex-start;
  margin: 24px;
  max-height: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
`;

export const StyledRoundedPaper = styled(RoundedPaper)`
  display: grid;
  flex: 1;
  max-height: 100%;

  .MuiTableContainer-root {
    background-color: ${PALETTE.SMOKE_MAIN};
    height: 100%;

    .MuiTable-root {
      .MuiTableCell-root {
        word-break: break-word;
      }
    }
  }
`;
