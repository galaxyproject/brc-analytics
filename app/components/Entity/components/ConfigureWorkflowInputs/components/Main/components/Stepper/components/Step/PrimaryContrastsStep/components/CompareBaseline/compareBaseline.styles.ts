import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack, TableContainer } from "@mui/material";

export const StyledStack = styled(Stack)`
  width: 100%;

  .MuiTypography-body-500 {
    padding: 0 20px;

    ${bpDownSm} {
      padding: 0 16px;
    }
  }
`;

export const StyledTableContainer = styled(TableContainer)`
  background-color: ${PALETTE.SMOKE_MAIN};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};

  .MuiTableCell-root {
    .MuiRadio-root,
    .MuiCheckbox-root {
      .MuiSvgIcon-root {
        font-size: 18px;
      }
    }
  }
`;
