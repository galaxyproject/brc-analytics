import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Button } from "@mui/material";
import { ACTION_PLACEMENT } from "./constants";
import type { StyledButtonProps } from "./types";

// The panel can render the handoff at both its start and its end, and only the
// copy for the screen width shows; the other is out of the layout, the focus
// order and the accessibility tree. On narrow screens the setup is a tab of
// its own, so the handoff leads it.
export const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "placement",
})<StyledButtonProps>`
  display: ${({ placement }) =>
    placement === ACTION_PLACEMENT.START ? "none" : "flex"};
  margin: 16px 0;
  text-transform: none;

  ${bpDownMd} {
    display: ${({ placement }) =>
      placement === ACTION_PLACEMENT.START ? "flex" : "none"};
    margin: 0 0 32px;
  }
`;
