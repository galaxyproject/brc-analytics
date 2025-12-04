import styled from "@emotion/styled";
import { PADDING_Y as SECTION_PADDING_Y } from "../../../SectionContent/sectionContent.styles";
import { PADDING_Y_BOTTOM as HERO_SECTION_PADDING_Y_BOTTOM } from "../../sectionHero.styles";

const PADDING_Y = 56;

const MARGIN_TOP =
  SECTION_PADDING_Y + HERO_SECTION_PADDING_Y_BOTTOM - 40 + PADDING_Y; // 40px is design space between the hero image and the section content

export const StyledImage = styled("img")`
  && {
    margin: -${MARGIN_TOP}px 0 0 0;
    padding: ${PADDING_Y}px 0;
    position: relative;
    width: 100%;
    z-index: 2;

    + h1,
    + h2,
    + h3,
    + h4,
    + h5,
    + h6 {
      margin-top: 0;
    }
  }
`;
