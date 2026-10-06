import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Chip } from "@mui/material";

export const StyledBetaChip = styled(Chip)`
  background-color: ${PALETTE.PRIMARY_LIGHTEST};
  border-radius: 4px;
  color: ${PALETTE.PRIMARY_MAIN};
  height: auto;

  .MuiChip-label {
    font: ${FONT.BODY_SMALL_500};
    padding: 2px 5px;
  }
`;
