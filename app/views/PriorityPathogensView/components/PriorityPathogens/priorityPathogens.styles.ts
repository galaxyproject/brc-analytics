import { Grid, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledGrid = styled(Grid)`
  display: grid;
  grid-template-columns: 1fr;

  .MuiPaper-root {
    align-self: flex-start;
  }

  .MuiCardActionArea-root {
    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};

      .MuiCardActionArea-focusHighlight {
        opacity: 0;
      }
    }
  }

  ${mediaTabletUp} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StyledSectionText = styled(Typography)`
  h2,
  h3 {
    display: none;
  }

  -webkit-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;
