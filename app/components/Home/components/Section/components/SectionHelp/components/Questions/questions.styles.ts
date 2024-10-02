import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { sectionGrid } from "../../../../../../../Layout/components/AppLayout/components/Section/section.styles";

export const Grid = styled.div`
  ${sectionGrid};
  grid-column: 1 / -1;
  grid-template-columns: 1fr;

  ${mediaTabletUp} {
    grid-column: 6 / -1;
    grid-template-columns: repeat(7, 1fr);
  }
`;
