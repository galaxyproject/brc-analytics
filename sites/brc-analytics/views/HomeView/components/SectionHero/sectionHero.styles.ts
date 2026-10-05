import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import {
  bpDownMd,
  bpDownSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import {
  section,
  sectionLayout,
} from "@repo/shared/components/layout/Section/section.styles";
import { HERO_IMAGES } from "./constants";

export const StyledSection = styled.section`
  ${section};
  background-color: ${PALETTE.COMMON_WHITE};
  overflow: hidden;
  position: relative; /* positions images */
  z-index: 0; /* section content above images */
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  display: grid;
  gap: 32px;
  justify-items: center;
  max-width: 752px;
  padding: 72px 16px 96px;
  position: relative; /* content above images */

  ${bpDownMd} {
    max-width: 608px;
  }

  ${bpDownSm} {
    padding: 48px 16px 108px;
  }
`;

export const Headline = styled.div`
  display: grid;
  gap: 16px;
  justify-items: center;
  text-align: center;

  ${bpDownSm} {
    max-width: 328px;
  }
`;

export const Head = styled.h1`
  color: ${PALETTE.COMMON_BLACK};
  font-family: "Inter Tight", sans-serif;
  font-size: 48px;
  font-weight: 500;
  letter-spacing: normal;
  line-height: 56px;
  margin: 0;

  br {
    display: none;
  }

  ${bpDownSm} {
    font-size: 32px;
    line-height: 40px;

    br {
      display: block;
    }
  }
`;

export const Subhead = styled.h2`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400_2_LINES};
  margin: 0;
`;

/**
 * Images flanking the headline.
 *
 * At desktop widths they are positioned from the centre of the page rather than
 * from the section edges: the offsets place them as the design does, and a
 * wider viewport then reveals more of each shape instead of carrying it outward
 * with the edge.
 *
 * Narrower than that, the same offsets would carry both shapes off screen, so
 * each one scales down and anchors instead to the corner it occupies — the left
 * shape to the top left, the right shape to the bottom right — keeping it in
 * view and holding its place as the hero's height changes. On the narrowest
 * widths the shapes drop back in opacity and float behind the hero content.
 */
const HeroImage = styled.div`
  background-repeat: no-repeat;
  background-size: contain;
  display: block;
  position: absolute;

  ${bpDownSm} {
    opacity: 0.1;
  }
`;

export const HeroImageLeft = styled(HeroImage)`
  background-image: url(${HERO_IMAGES.LEFT.src});
  height: ${HERO_IMAGES.LEFT.height}px;
  left: calc(50% - 788px);
  top: 40px;
  width: ${HERO_IMAGES.LEFT.width}px;

  ${bpDownMd} {
    height: 228px;
    left: -88px;
    top: 16px;
    width: 206px;
  }

  ${bpDownSm} {
    height: 172px;
    left: -32px;
    top: -22px;
    width: 156px;
  }
`;

export const HeroImageRight = styled(HeroImage)`
  background-image: url(${HERO_IMAGES.RIGHT.src});
  height: ${HERO_IMAGES.RIGHT.height}px;
  right: calc(50% - 824px);
  top: 60px;
  width: ${HERO_IMAGES.RIGHT.width}px;

  ${bpDownMd} {
    bottom: -44px;
    height: 260px;
    right: -32px;
    top: auto;
    width: 234px;
  }

  ${bpDownSm} {
    bottom: -28px;
    height: 324px;
    right: -42px;
    top: auto;
    width: 292px;
  }
`;
