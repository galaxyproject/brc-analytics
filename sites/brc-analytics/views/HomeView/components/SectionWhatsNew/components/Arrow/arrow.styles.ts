import { COLOR_MIXES } from "@databiosphere/findable-ui/lib/styles/common/constants/colorMixes";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { IconButton } from "@mui/material";

export const StyledIconButton = styled(IconButton)`
  & {
    background-color: ${PALETTE.COMMON_WHITE};
    border-radius: 4px;
    box-shadow:
      inset 0 0 0 1px ${PALETTE.SMOKE_DARK},
      0 1px 0 0 ${COLOR_MIXES.COMMON_BLACK_08};
    color: ${PALETTE.INK_MAIN};
    padding: 8px;

    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};
    }

    &:active {
      box-shadow: inset 0 0 0 1px ${PALETTE.SMOKE_DARK};
    }

    &.Mui-disabled {
      color: ${PALETTE.INK_MAIN};
      opacity: 0.5;
    }
  }
`;
