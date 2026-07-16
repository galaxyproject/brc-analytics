import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Link, Stack } from "@mui/material";

export const StyledStack = styled(Stack)`
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 16px;

  h1 {
    line-height: 56px;
  }
`;

export const StyledLink = styled(Link)`
  align-self: center;
  align-items: center;
  color: ${PALETTE.INK_LIGHT};
  display: flex;
  font: ${FONT.BODY_SMALL_400};
  gap: 2px;
  padding: 4px 0;
` as typeof Link;
