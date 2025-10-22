import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { TableContainer } from "@mui/material";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledTableContainer = styled(TableContainer)`
  margin: 24px 0;

  .MuiTable-root {
    min-width: calc(390px - 32px);

    tr {
      td,
      th {
        border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
        padding: 12px;

        &:first-of-type {
          padding-left: 0;
        }

        &:last-of-type {
          padding-right: 0;
        }
      }

      th {
        font: ${FONT.BODY_500};

        &:empty {
          padding: 0;
        }
      }

      td {
        font: ${FONT.BODY_400};
      }
    }
  }
`;
