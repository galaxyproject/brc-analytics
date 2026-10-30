import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { StyledGridItem } from "@repo/shared/views/AssistantView/components/Layout/components/GridItem/gridItem.styles";

export const StyledStack = styled(StyledGridItem)`
  align-items: center;
  // Inset, so the neighbouring columns' backgrounds can't paint over it.
  box-shadow:
    inset 1px 0 0 ${PALETTE.SMOKE_MAIN},
    inset -1px 0 0 ${PALETTE.SMOKE_MAIN};
  // No bottom padding: the conversation's composer pins to the column's foot
  // and keeps its own gap from it.
  padding: 40px 40px 0;

  ${bpDownMd} {
    box-shadow: none;
    padding: 16px;
  }
`;

// Fills at least the column, and grows with the conversation so the column
// scrolls it.
export const StyledChatInner = styled(Stack)`
  flex: 1 0 auto;
  max-width: 640px;
  width: 100%;
`;
