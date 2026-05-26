import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const StyledMain = styled(DXMain)`
  flex-direction: column;
`;

export const StyledPagesMain = styled(DXMain)`
  background-color: ${PALETTE.COMMON_WHITE};
  flex-direction: column;
`;
