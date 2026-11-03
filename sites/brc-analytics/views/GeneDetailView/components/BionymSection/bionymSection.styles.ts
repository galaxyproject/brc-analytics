import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

// The label, slider and count on one row, wrapping onto more on a narrow
// screen rather than overflowing the panel.
export const ConfidenceControl = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;

  .MuiSlider-root {
    flex: 1 1 160px;
    max-width: 320px;
  }
`;

// Dataset claims can hold long unbroken names, such as
// "(29hpi_minus_Shield)_over_(29hpi_plus_Shield)", which would otherwise widen
// the panel past a narrow screen.
export const SourceList = styled.ol`
  display: grid;
  overflow-wrap: anywhere;
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
