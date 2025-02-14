import styled from "@emotion/styled";
import { Grid2 } from "@mui/material";

export const StyledGrid2 = styled(Grid2)`
  cursor: pointer;
  padding: 20px;

  .MuiSvgIcon-root {
    align-self: center;
    transform: rotate(180deg);
    transition: transform 300ms;
  }

  &:hover {
    .MuiSvgIcon-root {
      transform: rotate(180deg) translateX(-2px);
    }
  }
`;
