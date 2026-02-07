import styled from "@emotion/styled";

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const SearchFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SearchForm = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;

    button {
      align-self: stretch !important;
    }
  }
`;

export const SearchHelperText = styled.div`
  text-align: center;

  @media (max-width: 768px) {
    text-align: left;
  }
`;
