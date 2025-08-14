import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Section } from "../../../../../../../common/Section/section";
import { sectionGrid, sectionLayout } from "../../section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";

export const StyledSection = styled(Section)`
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  overflow: hidden;
  position: relative; /* positions svg */
  z-index: 0; /* section content above svg */
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  align-content: flex-start;
  min-height: 152px;
  padding: 56px 16px;
`;

export const Headline = styled.div`
  align-content: flex-start;
  display: grid;
  gap: 8px;
  grid-column: 1 / -1;
`;

export const Head = styled.h1`
  font-family: "Inter Tight", sans-serif;
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -0.4px;
  line-height: 72px;
  margin: 0;

  ${bpUpSm} {
    span {
      display: block;
    }
  }
`;

export const SubHeadline = styled.div`
  grid-column: 1 / -1;

  ${bpUpSm} {
    grid-column: 1 / 8;
  }
`;

export const Subhead = styled.div`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_LARGE_400};
  margin: 0;
`;
