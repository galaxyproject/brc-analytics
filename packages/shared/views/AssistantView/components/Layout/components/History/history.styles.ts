import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { StyledGridItem } from "@repo/shared/views/AssistantView/components/Layout/components/GridItem/gridItem.styles";

export const StyledStack = styled(StyledGridItem)`
  align-items: flex-start;
  background-color: ${PALETTE.SMOKE_LIGHT};
  gap: 8px;
  justify-content: space-between;
  padding: 16px;

  .MuiButton-root {
    align-self: flex-start;
  }

  ${bpDownMd} {
    justify-content: flex-start;
  }
`;
