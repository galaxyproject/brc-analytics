import {
  bpUpMd,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Bullets } from "../../../../../../../../common/Bullets/bullets";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_HEIGHT_SM,
  MAX_CARD_WIDTH,
} from "./common/constants";

export const CarouselView = styled.div`
  grid-column: 1 / -1;
  max-width: ${MAX_CARD_WIDTH}px;
  width: 100%;

  ${bpUpMd} {
    grid-column: 7 / -1;
    grid-row: 1 / 3;
    justify-self: flex-end;
  }
`;

export const Carousel = styled.div`
  cursor: grab;
  height: ${CAROUSEL_HEIGHT_SM}px;
  position: relative; /* Positions CardPositioner. */
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  ${bpUpSm} {
    height: ${CAROUSEL_HEIGHT}px;
  }

  .MuiIconButton-root {
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  &:hover {
    > .MuiIconButton-root {
      opacity: 1;
    }
  }
`;

export const StyledBullets = styled(Bullets)`
  bottom: 14px;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  z-index: 100;
`;
