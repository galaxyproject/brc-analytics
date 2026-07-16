import styled from "@emotion/styled";
import { Grid } from "@mui/material";

export const StyledGrid = styled(Grid)`
  display: grid;
  gap: 16px;
  width: 100%;

  .MuiButton-root {
    justify-self: flex-start;
  }
`;
