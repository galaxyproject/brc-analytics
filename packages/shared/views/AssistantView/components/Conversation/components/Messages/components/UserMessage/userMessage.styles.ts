import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Typography } from "@mui/material";

export const StyledTypography = styled(Typography)`
  align-self: flex-end;
  background-color: ${PALETTE.SMOKE_MAIN};
  border-radius: 8px;
  max-width: 80%;
  overflow-wrap: break-word;
  padding: 8px 12px;
  white-space: pre-wrap;
` as typeof Typography;
