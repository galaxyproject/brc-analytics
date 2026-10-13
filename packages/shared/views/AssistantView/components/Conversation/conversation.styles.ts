import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  gap: 16px;
  height: 100%;
  min-height: 0;

  // On narrow screens the page scrolls the chat tab, composer included, and
  // the composer is kept clear of the bottom edge when brought into view.
  ${bpDownMd} {
    height: auto;
    scroll-margin-bottom: 16px;
  }
`;
