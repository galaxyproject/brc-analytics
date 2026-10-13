import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { StyledGridItem } from "@repo/shared/views/AssistantView/components/Layout/components/GridItem/gridItem.styles";

export const StyledStack = styled(StyledGridItem)`
  background-color: ${PALETTE.SMOKE_LIGHT};
  padding: 16px;

  ${bpDownMd} {
    background-color: ${PALETTE.COMMON_WHITE};
  }
`;
