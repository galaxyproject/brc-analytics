import {
  inkLight,
  inkMain,
  smokeLight,
  smokeMain,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { textBody400 } from "@databiosphere/findable-ui/lib/styles/common/mixins/fonts";
import styled from "@emotion/styled";
import { Dialog } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: ${smokeMain};
    gap: 1px;
    max-width: 824px;

    .MuiDialogTitle-root {
      background-color: ${white};
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      padding: 16px;

      .MuiSvgIcon-root {
        color: ${inkLight};
        font-size: 20px;
      }
    }

    .MuiDialogContent-root {
      background-color: ${smokeLight};
      padding: 24px;

      .MuiFormControl-root {
        display: grid;
        gap: 4px;

        .MuiFormLabel-root {
          ${textBody400};
          color: ${inkMain};
        }

        .MuiFormHelperText-root {
          margin: 0;

          &:not(.Mui-error) {
            color: ${inkLight};
          }
        }
      }
    }

    .MuiDialogActions-root {
      background-color: ${white};
    }
  }
`;
