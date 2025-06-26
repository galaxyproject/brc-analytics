import { Grid, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledGrid = styled(Grid)`
  display: grid;
  grid-template-columns: 1fr;

  .MuiPaper-root {
    align-self: flex-start;
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
