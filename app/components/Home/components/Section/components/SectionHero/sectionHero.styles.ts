import { bpUpMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Section } from "../../../../../common/Section/section";
import {
  section,
  sectionGrid,
  sectionLayout,
} from "../../../../../Layout/components/AppLayout/components/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledSection = styled(Section)`
  ${section};
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  overflow: hidden;
  position: relative; /* positions svg */
  z-index: 0; /* section content above svg */
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  align-content: flex-start;
  gap: 56px 16px;
  justify-items: center;
  padding: 112px 16px;

  ${bpUpMd} {
    gap: 8px 16px;
    justify-items: unset;
  }
`;

export const Headline = styled.div`
  display: grid;
  gap: 8px 0;
  grid-column: 1 / -1;
  text-align: center;
  max-width: 560px;

  ${bpUpMd} {
    grid-column: 1 / span 6;
    text-align: left;
  }
`;

export const Head = styled.h1`
  color: ${PALETTE.COMMON_BLACK};
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
  justify-items: center;

  .MuiButton-root {
    text-transform: none;
  }

  ${bpUpMd} {
    justify-items: flex-start;
  }
`;

export const Subhead = styled.h2`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400_2_LINES};
  margin: 0;
`;
