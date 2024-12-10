import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import {
  inkMain,
  smokeDark,
  smokeLightest,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { black08 } from "@databiosphere/findable-ui/lib/theme/common/palette";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { IconButton as MIconButton } from "@mui/material";
import {
  SWIPE_ACTION,
  SwipeAction,
} from "../../../../../../../../../../hooks/useSwipeInteraction/common/entities";
import { MAX_DECK_SIZE } from "../../common/constants";
import { getArrowTransform } from "../../common/utils";

interface Props {
  swipeAction: SwipeAction;
}

export const IconButton = styled(MIconButton, {
  shouldForwardProp: (props) => props !== "swipeAction",
})<Props>`
  & {
    background-color: ${white};
    border-radius: 50%;
    box-shadow:
      inset 0 0 0 1px ${smokeDark},
      0 1px 0 0 ${black08};
    color: ${inkMain};
    position: absolute;
    top: 50%;
    transform: ${({ swipeAction }) => getArrowTransform(swipeAction)};
    z-index: ${MAX_DECK_SIZE + 1};

    &:hover {
      background-color: ${smokeLightest};
    }

    &:active {
      box-shadow: inset 0 0 0 1px ${smokeDark};
    }

    ${mediaTabletDown} {
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
