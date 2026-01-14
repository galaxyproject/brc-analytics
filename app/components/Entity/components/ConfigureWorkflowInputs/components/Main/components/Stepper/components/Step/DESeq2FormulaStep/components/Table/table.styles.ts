import { TableContainer } from "@mui/material";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledTableContainer = styled(TableContainer)`
  background-color: ${PALETTE.SMOKE_MAIN};
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};

  .MuiTableCell-root {
    .MuiRadio-root {
      .MuiSvgIcon-root {
        font-size: 18px;
      }
    }
  }
`;
