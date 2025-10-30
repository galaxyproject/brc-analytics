import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDown820 } from "@databiosphere/findable-ui/src/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Grid, Paper } from "@mui/material";

export const StyledPaper = styled(Paper)`
  background-color: ${PALETTE.SMOKE_LIGHT};
  display: grid;
  gap: 24px;
  justify-items: center;
  padding: 24px;
  text-align: center;
  width: 100%;

  .MuiButton-root {
    text-transform: none;
  }
`;

export const StyledGrid = styled(Grid)`
  justify-content: center;

  ${bpDown820} {
    flex-direction: column;
  }

  .MuiButton-root {
    width: fit-content;
  }

  .MuiDivider-root {
    min-height: 60px;

    .MuiDivider-wrapper {
      padding: 4px 0;
    }
  }
`;
