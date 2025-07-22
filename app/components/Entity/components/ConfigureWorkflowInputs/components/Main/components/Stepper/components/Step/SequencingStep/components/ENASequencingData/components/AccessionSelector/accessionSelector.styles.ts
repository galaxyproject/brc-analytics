import { textBody400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import { Dialog } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: ${PALETTE.SMOKE_MAIN};
    gap: 1px;
    max-width: 824px;

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
      background-color: ${PALETTE.SMOKE_LIGHT};
      padding: 24px;

      .MuiFormControl-root {
        display: grid;
        gap: 4px;

        .MuiFormLabel-root {
          ${textBody400};
          color: ${PALETTE.INK_MAIN};
        }

        .MuiFormHelperText-root {
          margin: 0;

          &:not(.Mui-error) {
            color: ${PALETTE.INK_LIGHT};
          }
        }
      }
    }

    .MuiDialogActions-root {
      background-color: ${PALETTE.COMMON_WHITE};
    }
  }
`;
