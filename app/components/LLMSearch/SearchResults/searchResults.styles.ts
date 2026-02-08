import styled from "@emotion/styled";
import { Card, Typography } from "@mui/material";

export const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const InterpretationCard = styled(Card)`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;

  .MuiCardContent-root {
    padding: 24px;

    &:last-child {
      padding-bottom: 24px;
    }
  }
`;

export const ChipContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ResultStats = styled.div`
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
`;

export const ResultCard = styled(Card)`
  border: 1px solid #e9ecef;
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .MuiCardContent-root {
    padding: 20px;

    &:last-child {
      padding-bottom: 20px;
    }
  }
`;

export const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ResultTitle = styled(Typography)`
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

export const ResultMeta = styled.div`
  margin-bottom: 16px;
`;
