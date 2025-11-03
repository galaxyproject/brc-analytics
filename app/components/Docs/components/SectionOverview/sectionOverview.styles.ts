import styled from "@emotion/styled";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { Card, Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  display: grid;
  gap: 40px 16px;
  grid-template-columns: 1fr 1fr;

  ${bpDownSm} {
    grid-template-columns: 1fr;
  }
`;

export const StyledCard = styled(Card)`
  .MuiCardActionArea-root {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .MuiCardActionArea-focusHighlight {
      background-color: transparent;
    }
  }

  .MuiCardMedia-root {
    aspect-ratio: 280/157;
    border: none;
    border-radius: 8px;
    margin: 0;
  }

  .MuiTypography-body-large-500 {
    font-size: 20px;
    line-height: 28px;
    margin: 0;
    padding-right: 56px;
  }
`;
