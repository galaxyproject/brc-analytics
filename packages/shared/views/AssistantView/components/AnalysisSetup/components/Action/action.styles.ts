import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Button } from "@mui/material";
import type { StyledButtonProps } from "./types";

// On narrow screens the setup is a tab of its own, so the handoff leads it and
// only appears once the setup is complete.
export const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "complete",
})<StyledButtonProps>`
  margin: 16px 0;
  text-transform: none;

  ${bpDownMd} {
    display: ${({ complete }) => (complete ? "flex" : "none")};
    margin: 0 0 16px;
    order: -1;
  }
`;
