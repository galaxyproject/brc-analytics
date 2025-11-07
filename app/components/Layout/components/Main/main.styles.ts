import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledMain = styled(DXMain)`
  flex-direction: column;
`;

export const StyledPagesMain = styled(DXMain)`
  background-color: ${PALETTE.COMMON_WHITE};
  flex-direction: column;
`;

/**
 * Full-width main container for browser pages.
 * Removes max-width constraints and padding to allow full viewport usage.
 */
export const StyledBrowserMain = styled(DXMain)`
  background-color: ${PALETTE.COMMON_WHITE};
  flex-direction: column;
  max-width: 100% !important;
  padding: 0 !important;
  width: 100% !important;
`;
