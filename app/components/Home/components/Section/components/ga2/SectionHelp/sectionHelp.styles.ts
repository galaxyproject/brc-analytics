import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import {
  sectionGrid,
  sectionLayout,
} from "../../../../../../Layout/components/AppLayout/components/Section/section.styles";
import {
  SectionHeadline,
  SectionSubtitle,
  SectionTitle,
} from "../../../section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const Section = styled.section`
  background-color: ${PALETTE.COMMON_WHITE};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  width: 100%;
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  ${sectionGrid};
  padding: 85px 16px 150px;
`;

export const Headline = styled(SectionHeadline)`
  align-content: flex-start;
  grid-column: 1 / -1;
  max-width: 504px;

  ${bpUpSm} {
    grid-column: 1 / 5;
    max-width: unset;
  }
`;

export const StyledSectionTitle = styled(SectionTitle)`
  max-width: 276px;
`;

export const StyledSectionSubTitle = styled(SectionSubtitle)`
  line-height: 28px;
`;
