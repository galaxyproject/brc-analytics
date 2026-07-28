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
