import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

/* One band over the results: what was searched on the left, then the
   settings, then the ways out. Wraps to three short rows on a phone rather
   than hiding anything behind a toggle. */
export const Strip = styled.section`
  align-items: center;
  background: ${PALETTE.COMMON_WHITE};
  border: 1px solid ${PALETTE.SMOKE_MAIN};
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 12px 16px;
`;

export const StripQuery = styled.div`
  display: flex;
  flex: 1 1 280px;
  flex-direction: column;
  min-width: 0;
`;

/* One line of the sequence, cut with an ellipsis: enough to recognise it,
   and the whole thing is one click away in Edit search. */
export const StripSequence = styled.span`
  color: ${PALETTE.INK_LIGHT};
  font-family: monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StripFacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-variant-numeric: tabular-nums;
`;

export const StripActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
