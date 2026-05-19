import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { SectionTitle } from "../../../EntityView/ui/SectionTitle/sectionTitle";

export const StyledSectionTitle = styled(SectionTitle)`
  ${bpDownSm} {
    padding: 0 16px;
  }
`;
