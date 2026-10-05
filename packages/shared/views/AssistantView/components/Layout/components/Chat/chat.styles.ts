import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { StyledGridItem } from "@repo/shared/views/AssistantView/components/Layout/components/GridItem/gridItem.styles";

export const StyledStack = styled(StyledGridItem)`
  align-items: center;
  // Inset, so the neighbouring columns' backgrounds can't paint over it.
  box-shadow:
    inset 1px 0 0 ${PALETTE.SMOKE_MAIN},
    inset -1px 0 0 ${PALETTE.SMOKE_MAIN};
  padding: 40px 56px 16px;

  > .MuiStack-root {
    flex: 1;
    max-width: 640px;
    min-height: 0;
    width: 100%;
  }

  ${bpDownMd} {
    box-shadow:
      inset 0 1px 0 ${PALETTE.SMOKE_MAIN},
      inset 0 -1px 0 ${PALETTE.SMOKE_MAIN};
    min-height: 500px;
    padding: 16px;
  }
`;
