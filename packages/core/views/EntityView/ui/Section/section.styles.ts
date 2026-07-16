import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import { SECTION_PADDING } from "../styles";

export const StyledStack = styled(Stack)`
  ${SECTION_PADDING};
  background-color: ${PALETTE.COMMON_WHITE};
  gap: 16px;
  min-width: 0;
`;
