import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Toolbar } from "@mui/material";

export const StyledToolbar = styled(Toolbar)`
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  justify-content: flex-end;
  padding: 16px;
`;
