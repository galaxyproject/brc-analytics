import styled from "@emotion/styled";
import { Grid } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledGrid = styled(Grid)`
  box-shadow: inset -1px 0 ${PALETTE.SMOKE_MAIN};
  overflow: auto;
`;
