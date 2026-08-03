import { SectionHeadline } from "@/components/Home/components/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { sectionLayout } from "@repo/shared/components/layout/Section/section.styles";
import { BULLETS_CLASSES } from "@repo/shared/views/HomeView/components/Bullets/constants";

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

  .${BULLETS_CLASSES.BULLET_ACTIVE} {
    --bullet-active-color: #fc5e60;
  }
`;

export const Headline = styled(SectionHeadline)`
  align-self: center;
  grid-column: 1 / -1;
  max-width: 560px;
  text-align: center;
`;
