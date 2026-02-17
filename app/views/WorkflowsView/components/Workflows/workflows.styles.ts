import type { LayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/types";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Container, Stack } from "@mui/material";

export const StyledContainer = styled(Container, {
  shouldForwardProp: (prop) => prop !== "bottom" && prop !== "top",
})<LayoutSpacing>`
  & {
    align-content: flex-start;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    flex: 1;
    gap: 16px;
    margin-top: ${({ top }) => top}px;
    padding: 24px;

    ${bpDownSm} {
      padding: 16px;
    }
  }
`;

export const StyledStack = styled(Stack)`
  flex-direction: row;
  grid-column: 1 / -1;
  justify-content: space-between;
`;
