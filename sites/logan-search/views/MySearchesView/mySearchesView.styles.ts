import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const ListHeader = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const SearchList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

/* Status | what and when | what it found. The pill leads so a running or
   expired search is what the eye lands on going down the list. */
export const SearchRow = styled.li`
  align-items: center;
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  display: grid;
  gap: 4px 16px;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  padding: 12px 0;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr) auto;

    > :first-of-type {
      grid-column: 1 / -1;
    }
  }
`;

export const RowText = styled.div`
  min-width: 0;

  > :first-of-type {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const RowCount = styled.div`
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
`;
