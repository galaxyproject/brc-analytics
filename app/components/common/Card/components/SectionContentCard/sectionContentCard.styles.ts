import styled from "@emotion/styled";
import { Card, Stack } from "@mui/material";

export const StyledCard = styled(Card)`
  &.MuiPaper-root {
    align-items: stretch;
    display: flex;
  }

  .MuiButtonBase-root {
    align-content: flex-start;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
    padding: 16px;

    .MuiSvgIcon-root {
      box-sizing: content-box;
    }

    img {
      margin: 0;
    }
  }
` as typeof Card;

export const StyledStack = styled(Stack)`
  grid-column: 1 / span all;
`;
