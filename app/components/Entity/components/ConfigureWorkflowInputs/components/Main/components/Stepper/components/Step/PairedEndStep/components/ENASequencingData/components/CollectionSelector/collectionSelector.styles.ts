import {
  inkLight,
  smokeLight,
  smokeMain,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import { Dialog } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: ${smokeMain};
    gap: 1px;
    height: 100%;
    margin: 64px 32px;
    max-height: calc(100% - 128px);
    max-width: calc(100% - 64px);
    width: 100%;

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
      align-content: flex-start;
      display: grid;
      grid-template-columns: 1fr;
      background-color: ${smokeLight};
      padding: 0;
    }

    .MuiDialogActions-root {
      background-color: ${white};
    }
  }
`;
