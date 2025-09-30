import {
  bpUpLg,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import {
  section,
  sectionGrid,
  sectionLayout,
} from "../../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { PALETTE_BRAND } from "../../../../../../../styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledSection = styled("section")`
  ${section};
  background-color: ${PALETTE_BRAND.SURFACE};
  overflow: hidden;
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  align-content: flex-start;
  gap: 0 16px;
  padding: 0 16px;
`;

export const Headline = styled.div`
  align-items: flex-start;
  align-self: flex-start;
  display: grid;
  gap: 8px 0;
  grid-column: 1 / -1;
  grid-row: 1;
  padding: 56px 0 12px;
  text-align: left;

  ${bpUpSm} {
    grid-column: 1 / span 6;
    padding: 126px 0 0;
  }

  ${bpUpLg} {
    grid-column: 1 / span 5;
    padding: 152px 0 0;
  }
`;

export const Head = styled.h1`
  color: ${PALETTE_BRAND.DARK_SIENNA};
  font-family: "Inter", sans-serif;
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -1.4px;
  line-height: 56px;
  margin: 0;
`;

export const SubHeadline = styled.div`
  display: grid;
  gap: 16px;
  justify-items: flex-start;

  .MuiButton-root {
    text-transform: none;
  }
`;

export const Subhead = styled.h2`
  color: ${PALETTE_BRAND.DARK_SIENNA};
  font: ${FONT.BODY_LARGE_400_2_LINES};
  margin: 0;
  opacity: 0.8;
`;
