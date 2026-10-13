import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import type { StyledStackProps } from "./types";

export const StyledRoundedPaper = styled(RoundedPaper)`
  .MuiListItem-root + .MuiListItem-root {
    border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  }

  .MuiListItemButton-root {
    align-items: flex-start;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 16px;

    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};
    }
  }
`;

// On narrow screens, once the setup is complete, the chat offers the handoff
// instead, so the suggestions step aside.
export const StyledStack = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "isSetupComplete",
})<StyledStackProps>`
  gap: 8px;

  ${bpDownMd} {
    display: ${({ isSetupComplete }) => (isSetupComplete ? "none" : "flex")};
  }
`;
