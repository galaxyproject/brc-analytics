import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import styled from "@emotion/styled";

export const GenesPanel = styled(GridPaperSection)`
  && {
    display: grid;
    gap: 24px;
    grid-column: 1 / -1;
    padding: 20px;
  }
`;
