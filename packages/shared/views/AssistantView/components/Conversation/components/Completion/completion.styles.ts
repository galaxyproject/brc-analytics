import { bpUpMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

// Only on narrow screens, where the setup and its handoff sit in another tab.
export const StyledStack = styled(Stack)`
  gap: 16px;

  .MuiButton-root {
    text-transform: none;
  }

  ${bpUpMd} {
    display: none;
  }
`;

// The heading and its text, and the two buttons, each held together.
export const StyledGroup = styled(Stack)`
  gap: 8px;
`;
