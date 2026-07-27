import styled from "@emotion/styled";

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const InputSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ControlSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
