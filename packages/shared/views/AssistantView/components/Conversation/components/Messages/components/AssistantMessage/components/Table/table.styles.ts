import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { focusVisibleOutline } from "@repo/shared/styles/mixins/focus";

export const StyledContainer = styled.div`
  border: 1px solid ${PALETTE.SMOKE_MAIN};
  border-radius: 8px;
  margin: 24px 0;
  overflow-x: auto;

  ${focusVisibleOutline}
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 100%;

  td,
  th {
    border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
    color: ${PALETTE.INK_MAIN};
    padding: 12px;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  td {
    font: ${FONT.BODY_SMALL_400};
  }

  th {
    background-color: ${PALETTE.SMOKE_LIGHTEST};
    font: ${FONT.BODY_SMALL_500};
  }

  // The container draws the bottom edge, whether the last row is in the body
  // or, for a table with no body rows, the head.
  > :last-child > tr:last-child > * {
    border-bottom: none;
  }
`;
