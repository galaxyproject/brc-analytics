import { Grid2 } from "@mui/material";
import styled from "@emotion/styled";

export const StyledGrid2 = styled(Grid2)`
  display: grid;
  gap: 16px;
  justify-items: flex-start;

  .MuiRadioGroup-root {
    min-width: 0;
    width: 100%;

    .MuiFormControlLabel-root {
      width: 100%;

      .MuiFormControlLabel-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
`;
