import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const SearchSection = styled(GridPaperSection)`
  && {
    align-self: stretch;
    margin: 0 auto;
    max-width: 1200px;
    padding: 32px 20px;
    width: 100%;
  }
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
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
