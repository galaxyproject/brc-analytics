import styled from "@emotion/styled";

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FieldRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

/* The query box wants width; the index pickers and threshold don't. Side by
   side they fill the row instead of leaving the right half of a 1200px page
   empty. Collapses to one column before the two halves get too cramped. */
export const FormGrid = styled.div`
  display: grid;
  gap: 24px 32px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

export const ControlRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

export const ResultsToolbar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;
