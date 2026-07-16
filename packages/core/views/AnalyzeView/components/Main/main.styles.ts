import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Card } from "@mui/material";

export const StyledCard = styled(Card)`
  .MuiCardActionArea-root {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 20px 16px;
    text-decoration: none;

    ${bpUpSm} {
      padding: 20px;
    }
  }

  .MuiCardContent-root {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
  }

  .MuiCardActions-root {
    padding: 0;

    .MuiIconButton-root {
      padding: 0;
    }
  }
` as typeof Card;
