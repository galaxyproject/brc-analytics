import { SectionTitle } from "@/views/EntityView/ui/SectionTitle/sectionTitle";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

export const StyledSectionTitle = styled(SectionTitle)`
  scroll-margin-top: 72px;

  ${bpDownSm} {
    padding: 0 16px;
  }
`;
