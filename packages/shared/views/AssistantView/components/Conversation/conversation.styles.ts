import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

// Any error, the suggestions and the composer, kept together at the foot of
// the conversation. On narrow screens a short conversation leaves the spare
// room above them, under the messages and any handoff.
export const StyledFooter = styled(Stack)`
  gap: 16px;
  margin-top: auto;
`;

export const StyledStack = styled(Stack)`
  gap: 16px;
  height: 100%;
  min-height: 0;

  // On narrow screens the page scrolls the chat tab, composer included. The
  // conversation fills at least the tab, so a short one still keeps the
  // composer at the bottom, and the composer is kept clear of the bottom edge
  // when brought into view.
  ${bpDownMd} {
    flex: 1 0 auto;
    height: auto;
    scroll-margin-bottom: 16px;
  }
`;
