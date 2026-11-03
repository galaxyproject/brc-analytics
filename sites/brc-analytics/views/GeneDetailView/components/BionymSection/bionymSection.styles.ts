import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const ConfidenceControl = styled.div`
  align-items: center;
  display: grid;
  gap: 4px 16px;
  grid-template-columns: max-content minmax(160px, 320px) max-content;
`;

export const SourceList = styled.ol`
  display: grid;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Source = styled.li`
  display: grid;
  gap: 8px;
`;

export const ClaimList = styled.ul`
  display: grid;
  gap: 12px;
  margin: 0;
  padding-left: 20px;
`;

export const Claim = styled.li`
  display: grid;
  gap: 4px;
`;

export const Quote = styled.blockquote`
  border-left: 3px solid ${PALETTE.SMOKE_MAIN};
  color: ${PALETTE.INK_LIGHT};
  margin: 0;
  padding-left: 12px;
`;
