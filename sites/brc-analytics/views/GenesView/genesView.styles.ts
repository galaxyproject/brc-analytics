import { BackPageView } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

// findable-ui's back page grid, as the assembly and organism pages use, with
// its rows kept to their content's height.
export const GenesBackPageView = styled(BackPageView)`
  align-content: start;
`;

export const GenesPanel = styled(GridPaperSection)`
  && {
    display: grid;
    gap: 24px;
    grid-column: 1 / -1;
    padding: 20px;
  }
`;

export const ResultsTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
    padding: 12px 16px;
    text-align: left;
  }

  th {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
  }
`;
