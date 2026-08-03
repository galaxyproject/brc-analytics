import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { SectionSubHero } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/sectionSubHero";

export const StyledSectionSubHero = styled(SectionSubHero)`
  --subhero-border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  --subhero-align-items: flex-start;
  --subhero-padding: 72px 0 104px;
  --subhero-transparent-align: flex-end;
`;
