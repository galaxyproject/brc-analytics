import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
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
`;

export const Headline = styled.div`
  display: grid;
  gap: 16px;
  text-align: center;
`;

export const Head = styled.h1`
  color: ${PALETTE.COMMON_BLACK};
  font-family: "Inter Tight", sans-serif;
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -1.4px;
  line-height: 56px;
  margin: 0;
`;

export const Subhead = styled.h2`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400_2_LINES};
  margin: 0;
`;

/**
 * Images flanking the headline. Positioned from the centre of the page rather
 * than from the section edges: the offsets place them as the 1440px design
 * does, and a wider viewport then reveals more of each shape instead of
 * carrying it outward with the edge.
 */
const HeroImage = styled.div`
  background-repeat: no-repeat;
  background-size: contain;
  display: block;
  position: absolute;

  ${bpDownSm} {
    display: none;
  }
`;

export const HeroImageLeft = styled(HeroImage)`
  background-image: url(${HERO_IMAGES.LEFT.src});
  height: ${HERO_IMAGES.LEFT.height}px;
  left: calc(50% - 788px);
  top: 43px;
  width: ${HERO_IMAGES.LEFT.width}px;
`;

export const HeroImageRight = styled(HeroImage)`
  background-image: url(${HERO_IMAGES.RIGHT.src});
  height: ${HERO_IMAGES.RIGHT.height}px;
  right: calc(50% - 824px);
  top: 63px;
  width: ${HERO_IMAGES.RIGHT.width}px;
`;
