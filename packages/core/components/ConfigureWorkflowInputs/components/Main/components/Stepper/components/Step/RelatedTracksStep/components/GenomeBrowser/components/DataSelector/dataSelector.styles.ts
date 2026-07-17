import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Paper } from "@mui/material";

export const StyledPaper = styled(Paper)`
  background-color: ${PALETTE.SMOKE_LIGHT};
  display: grid;
  gap: 24px;
  justify-items: center;
  padding: 24px;
  text-align: center;
  width: 100%;

  .MuiButton-root {
    text-transform: none;
  }
`;
