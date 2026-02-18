import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Card } from "@mui/material";

export const StyledCard = styled(Card)`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-column: auto / span 6;
  justify-content: flex-start;
  padding: 20px;

  .MuiCardContent-root,
  .MuiCardActions-root {
    padding: 0;
  }

  .MuiCardContent-root {
    flex: 1;
  }

  ${({ theme }) => theme.breakpoints.up(1920)} {
    grid-column: auto / span 4;
  }

  ${bpDownSm} {
    grid-column: 1 / -1;
  }
` as typeof Card;
