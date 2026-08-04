import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Paper } from "@mui/material";

export const StyledPaper = styled(Paper)`
  background-color: ${PALETTE.SMOKE_LIGHT};
  border-radius: 8px;
  display: grid;
  gap: 16px;
  justify-items: center;
  padding: 24px;
  text-align: center;
  width: 100%;
`;
