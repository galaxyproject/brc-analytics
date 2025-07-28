import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Dialog } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: ${PALETTE.SMOKE_MAIN};
    gap: 1px;
    height: 100%;
    margin: 64px 32px;
    max-height: calc(100% - 128px);
    max-width: calc(100% - 64px);
    width: 100%;

    .MuiDialogTitle-root {
      background-color: ${PALETTE.COMMON_WHITE};
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      padding: 16px;

      .MuiSvgIcon-root {
        color: ${PALETTE.INK_LIGHT};
        font-size: 20px;
      }
    }

    .MuiDialogContent-root {
      align-content: flex-start;
      background-color: ${PALETTE.SMOKE_LIGHT};
      display: grid;
      grid-template-columns: 1fr;
      padding: 0;
    }

    .MuiDialogActions-root {
      background-color: ${PALETTE.COMMON_WHITE};
    }
  }
`;
