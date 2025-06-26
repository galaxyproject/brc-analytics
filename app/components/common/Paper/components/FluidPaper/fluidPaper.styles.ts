import { Paper } from "@mui/material";
import styled from "@emotion/styled";
import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";

export const StyledPaper = styled(Paper)`
  align-self: stretch;
  border: 1px solid ${PALETTE.SMOKE_MAIN};
  border-radius: 8px;
  box-shadow: ${SHADOWS["01"]};
  overflow: hidden;

  ${mediaTabletDown} {
    border-left: none;
    border-radius: 0;
    border-right: none;
    box-shadow: none;
  }
`;
