import { SectionHeadline } from "@/components/Home/components/Section/section.styles";
import { sectionLayout } from "@brc-analytics/core/components/Layout/components/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const Section = styled.section`
  background-color: ${PALETTE.SMOKE_LIGHTEST};
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  overflow: hidden;
  width: 100%;
`;

export const SectionLayout = styled.div`
  ${sectionLayout};
  display: flex;
  flex-direction: column;
  gap: 48px 16px;
  padding: 64px 16px;
`;

export const Headline = styled(SectionHeadline)`
  align-self: center;
  grid-column: 1 / -1;
  max-width: 560px;
  text-align: center;
`;
