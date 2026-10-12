import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { HEADING_FONT_FAMILY } from "@logan/theme/fonts";
import { type HeroVariant } from "./types";

// How far the home page's search card rides up over the band. The band keeps
// this much extra padding at the bottom so the card never covers any text.
export const HERO_OVERLAP = 64;

// A paler violet than PRIMARY.LIGHTEST: findable-ui's INK_LIGHT only reaches
// 4.5:1 on white-ish grounds, so the band's own muted text is darker still
// (MUTED_TEXT is 6.0:1 here).
const BAND = "#F6F4FC";
const MUTED_TEXT = "#545F6B";

interface VariantProps {
  variant: HeroVariant;
}

export const HeroBand = styled.section`
  align-self: stretch;
  background-color: ${BAND};
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  overflow: hidden;
  position: relative; /* positions the motif */
  width: 100%;
  z-index: 0; /* text above the motif */
`;

export const HeroLayout = styled("div", {
  shouldForwardProp: (prop) => prop !== "variant",
})<VariantProps>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 auto;
  position: relative; /* positions the home page's lens */

  ${({ variant }) =>
    variant === "home"
      ? css`
          max-width: 1200px;
          padding: 40px 20px ${40 + HERO_OVERLAP}px;
        `
      : css`
          /* Lines the title up with the article column below it, as the shared
             docs hero does. */
          box-sizing: content-box;
          max-width: 756px;
          padding: 48px 16px 56px;
        `}
`;

export const Head = styled("h1", {
  shouldForwardProp: (prop) => prop !== "variant",
})<VariantProps>`
  color: ${PALETTE.INK_MAIN};
  font-family: ${HEADING_FONT_FAMILY};
  font-weight: 600;
  margin: 0;

  ${({ variant }) =>
    variant === "home"
      ? css`
          font-size: 48px;
          letter-spacing: -1px;
          line-height: 56px;
        `
      : css`
          font-size: 36px;
          letter-spacing: -0.6px;
          line-height: 44px;
        `}

  ${bpDownSm} {
    font-size: 32px;
    letter-spacing: -0.4px;
    line-height: 40px;
  }
`;

export const Subhead = styled.p`
  color: ${MUTED_TEXT};
  font: ${FONT.BODY_LARGE_400};
  margin: 0;
  max-width: 720px;
`;

export const Stats = styled.p`
  color: ${PALETTE.PRIMARY_DARK};
  font: ${FONT.BODY_500};
  margin: 4px 0 0;
`;
