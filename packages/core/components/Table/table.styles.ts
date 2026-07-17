import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { ThemeProps } from "@databiosphere/findable-ui/lib/theme/types";
import { css } from "@emotion/react";

export const tableStyles = (props: ThemeProps) => css`
  .MuiTable-root {
    .MuiTableHead-root {
      .MuiTableRow-root {
        .MuiTableCell-root {
          background-color: ${PALETTE.SMOKE_LIGHTEST};
        }
      }
    }

    ${bpUpSm(props)} {
      .MuiTableHead-root,
      .MuiTableBody-root {
        .MuiTableRow-root {
          .MuiTableCell-root {
            min-height: 56px;
            padding: 10px 16px;

            &.MuiTableCell-paddingCheckbox {
              padding-right: 0;
            }
          }
        }
      }
    }
  }
`;
