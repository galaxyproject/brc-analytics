import {
  smokeLight,
  inkLight,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import styled from "@emotion/styled";
import { Dialog } from "@mui/material";

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    .MuiDialogTitle-root {
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
      align-items: flex-start;
      display: grid;
      grid-template-columns: 1fr;
      background-color: ${smokeLight};
      padding: 0;
    }
  }
`;
