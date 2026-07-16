import { Table as DXTable } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/table";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { ThemeProps } from "@databiosphere/findable-ui/lib/theme/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

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

export const Table = styled(DXTable)`
  &.MuiTableContainer-root {
    ${tableStyles}
  }
` as typeof DXTable;
