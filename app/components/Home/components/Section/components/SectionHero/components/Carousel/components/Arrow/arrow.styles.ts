import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { IconButton as MIconButton } from "@mui/material";
import {
  SWIPE_ACTION,
  SwipeAction,
} from "../../../../../../../../../../hooks/useSwipeInteraction/common/entities";
import { MAX_DECK_SIZE } from "../../common/constants";
import { getArrowTransform } from "../../common/utils";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { COLOR_MIXES } from "@databiosphere/findable-ui/lib/styles/common/constants/colorMixes";

interface Props {
  swipeAction: SwipeAction;
}

export const IconButton = styled(MIconButton, {
  shouldForwardProp: (props) => props !== "swipeAction",
})<Props>`
  & {
    background-color: ${PALETTE.COMMON_WHITE};
    border-radius: 50%;
    box-shadow:
      inset 0 0 0 1px ${PALETTE.SMOKE_DARK},
      0 1px 0 0 ${COLOR_MIXES.COMMON_BLACK_08};
    color: ${PALETTE.INK_MAIN};
    position: absolute;
    top: 50%;
    transform: ${({ swipeAction }) => getArrowTransform(swipeAction)};
    z-index: ${MAX_DECK_SIZE + 1};

    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};
    }

    &:active {
      box-shadow: inset 0 0 0 1px ${PALETTE.SMOKE_DARK};
    }

    ${bpDownSm} {
      display: none;
    }
  }

  ${({ swipeAction }) =>
    swipeAction === SWIPE_ACTION.SWIPE_BACKWARD &&
    css`
      left: 0;
    `}

  ${({ swipeAction }) =>
    swipeAction === SWIPE_ACTION.SWIPE_FORWARD &&
    css`
      right: 0;
    `}
`;
