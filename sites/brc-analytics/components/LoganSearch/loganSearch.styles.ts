import styled from "@emotion/styled";

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/* The query box wants width; the index picker and threshold don't. Side by
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

/* Headline counts for the match set. Laid out as a row of labelled figures
   rather than a sentence so organisms/BioProjects/studies/countries read as
   four separate measurements of one set, not a list of trivia. */
export const CohortStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 40px;
  margin-top: 4px;
`;

export const CohortStat = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 88px;
`;

export const CohortFacetGrid = styled.div`
  display: grid;
  gap: 24px 40px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const CohortBarRows = styled.div`
  display: grid;
  gap: 2px;
  margin-top: 6px;
`;

/* label | bar | count | share. The bar and the share carry the proportion; the
   count is there because the proportion of a million is not a number anyone
   can reconstruct in their head. */
export const CohortBarRow = styled.div`
  align-items: center;
  display: grid;
  gap: 2px 12px;
  grid-template-columns: minmax(0, 1fr) 72px 80px 52px;

  /* Organism names run long; wrap rather than push the numbers off the row. */
  > :first-of-type {
    overflow-wrap: anywhere;
  }

  /* Too narrow for four columns: the share alone still carries the proportion,
     so the bar is what goes. */
  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr) auto auto;

    > :nth-of-type(2) {
      display: none;
    }
  }
`;
