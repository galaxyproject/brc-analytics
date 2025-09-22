import {
  bpDownSm,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Card as MCard } from "@mui/material";
import {
  MAX_CARD_HEIGHT,
  MAX_CARD_HEIGHT_SM,
  MAX_CARD_WIDTH,
} from "../../common/constants";
import {
  getCardTransform,
  getCardTransition,
  getCardZIndex,
} from "../../common/utils";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

interface Props {
  cardPosition: number;
}

export const CardPositioner = styled("div")<Props>`
  display: grid;
  height: 100%;
  max-height: ${MAX_CARD_HEIGHT_SM}px;
  max-width: ${MAX_CARD_WIDTH}px;
  position: absolute;
  transform: ${({ cardPosition }) => getCardTransform(cardPosition)};
  transition: ${({ cardPosition }) => getCardTransition(cardPosition)};
  width: 100%;
  z-index: ${({ cardPosition }) => getCardZIndex(cardPosition)};

  ${bpUpSm} {
    max-height: ${MAX_CARD_HEIGHT}px;
  }
`;

export const Card = styled(MCard)`
  border: none;
  box-shadow:
    ${SHADOWS["01"]},
    inset 0 0 0 1px ${PALETTE.SMOKE_MAIN};
  display: flex;
  height: 100%;
  width: 100%;
` as typeof MCard;

export const CardSection = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px;
`;

export const CardContent = styled.div`
  h1,
  h2,
  h3 {
    font: ${FONT.BODY_LARGE_500};
    margin: 0;
  }

  p {
    color: ${PALETTE.INK_LIGHT};
    font: ${FONT.BODY_SMALL_400_2_LINES};
    margin: 8px 0;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  ${bpDownSm} {
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    overflow: hidden;
  }
`;

export const CardActions = styled.div`
  align-items: center;
  display: flex;
  font: ${FONT.BODY_500};
  gap: 16px;
  margin-top: 16px;
`;
