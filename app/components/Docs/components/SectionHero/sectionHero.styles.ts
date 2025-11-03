import styled from "@emotion/styled";
import { SectionHero } from "../../../Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import {
  Head,
  SectionLayout,
} from "../../../Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero.styles";

export const PADDING_Y_BOTTOM = 90;

export const StyledSectionHero = styled(SectionHero)`
  ${SectionLayout} {
    min-height: unset;
    padding: 80px 16px ${PADDING_Y_BOTTOM}px;
  }

  ${Head} {
    font-family: "Inter", sans-serif;
    font-size: 32px;
    font-weight: 500;
    letter-spacing: normal;
    line-height: 40px;
  }
`;
