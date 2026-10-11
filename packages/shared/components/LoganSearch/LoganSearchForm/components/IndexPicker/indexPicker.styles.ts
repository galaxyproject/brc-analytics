import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

/* Scope cards: five presets plus Custom, so three to a row on a wide form
   (two full rows), fewer as it narrows, and one column on a phone. */
export const ScopeCards = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
`;

export const ScopeCard = styled.button`
  align-items: center;
  background: ${PALETTE.COMMON_WHITE};
  border: 1px solid ${PALETTE.SMOKE_DARK};
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
  display: grid;
  font: inherit;
  gap: 12px;
  grid-template-columns: auto minmax(0, 1fr);
  min-width: 0;
  padding: 12px 14px;
  text-align: left;

  &:hover {
    border-color: ${PALETTE.PRIMARY_MAIN};
  }

  /* The card that names the current selection. Custom has no aria-pressed --
     it opens the matrix -- so it carries data-current instead. */
  &[aria-pressed="true"],
  &[data-current="true"] {
    background: ${PALETTE.PRIMARY_LIGHTEST};
    border-color: ${PALETTE.PRIMARY_MAIN};
    box-shadow: inset 0 0 0 1px ${PALETTE.PRIMARY_MAIN};
  }

  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_MAIN};
    outline-offset: 2px;
  }
`;

export const ScopeText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ScopeTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
`;

export const ScopeNote = styled.span`
  color: ${PALETTE.INK_LIGHT};
  font-size: 13px;
  line-height: 18px;
`;

export const ScopeCount = styled.span`
  color: ${PALETTE.PRIMARY_MAIN};
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 18px;
`;

/* The logan-search.org group a card stands for, under its count, so the name
   people know from there is on the card rather than behind a hover. */
export const ScopeOrigin = styled.span`
  color: ${PALETTE.INK_LIGHT};
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 0 4px;
  line-height: 18px;

  code {
    color: ${PALETTE.INK_MAIN};
    font: inherit;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
`;

/* The matrix scrolls sideways inside its own box on a narrow screen, with the
   organism labels pinned, rather than pushing the page wider. */
export const MatrixScroll = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

export const MatrixTable = styled.table`
  border-collapse: separate;
  border-spacing: 4px;
  user-select: none;

  th {
    color: ${PALETTE.INK_LIGHT};
    font-size: 12px;
    font-weight: 500;
    padding: 0;
  }

  thead th {
    line-height: 15px;
    text-align: center;
    vertical-align: bottom;
    width: 72px;
  }

  thead th button {
    padding: 4px 2px 6px;
  }

  tbody th {
    background: ${PALETTE.COMMON_WHITE};
    left: 0;
    position: sticky;
    text-align: right;
    white-space: nowrap;
    z-index: 1;
  }

  /* A row label sits on one line with its rail beside it, so a row is only as
     tall as its cells. */
  tbody th button {
    align-items: center;
    display: flex;
    gap: 8px;
    height: 30px;
    justify-content: flex-end;
    padding: 0 8px;
  }

  tbody th button > span {
    flex: 0 0 20px;
    margin-top: 0;
  }

  td {
    padding: 0;
  }
`;

/* A row or column label, and the corner's All: a button that takes or drops
   the whole line, with a rail showing how much of the line is in. */
export const LineButton = styled.button`
  background: none;
  border: 0;
  border-radius: 6px;
  color: inherit;
  cursor: pointer;
  display: block;
  font: inherit;
  hyphens: manual;
  padding: 4px 8px 6px;
  text-align: inherit;
  width: 100%;

  &:hover,
  &[data-crossed="true"] {
    background: ${PALETTE.SMOKE_LIGHT};
    color: ${PALETTE.INK_MAIN};
  }

  &[data-full="true"] {
    color: ${PALETTE.PRIMARY_MAIN};
    font-weight: 600;
  }

  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_MAIN};
    outline-offset: 1px;
  }
`;

export const LineRail = styled.span`
  background: ${PALETTE.SMOKE_MAIN};
  border-radius: 2px;
  display: block;
  height: 3px;
  margin-top: 4px;
  overflow: hidden;

  > span {
    background: ${PALETTE.PRIMARY_MAIN};
    display: block;
    height: 100%;
  }
`;

export const MatrixCell = styled.button`
  background: ${PALETTE.SMOKE_MAIN};
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  display: block;
  height: 30px;
  padding: 0;
  width: 72px;

  &:hover,
  &[data-crossed="true"] {
    background: ${PALETTE.SMOKE_DARK};
  }

  &[aria-pressed="true"] {
    background: ${PALETTE.PRIMARY_MAIN};
  }

  &[aria-pressed="true"]:hover {
    background: ${PALETTE.PRIMARY_DARK};
  }

  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_DARK};
    outline-offset: 2px;
  }
`;

/* No index is registered for this pair: hatched, so it reads as a hole in the
   grid rather than a cell that failed to draw. */
export const MatrixGap = styled.div`
  background: repeating-linear-gradient(
    135deg,
    ${PALETTE.SMOKE_LIGHT} 0 5px,
    transparent 5px 10px
  );
  border: 1px dashed ${PALETTE.SMOKE_MAIN};
  border-radius: 6px;
  height: 30px;
  width: 72px;
`;

export const MatrixHint = styled.p`
  color: ${PALETTE.INK_LIGHT};
  font-size: 13px;
  line-height: 20px;
  margin: 8px 0 0;
`;

/* The count and its rail, beside the Search button. */
export const SummaryRow = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 240px;
  gap: 12px;
  min-width: 0;
`;

export const SummaryCount = styled.span`
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  white-space: nowrap;

  small {
    color: ${PALETTE.INK_LIGHT};
    font-size: 14px;
    font-weight: 400;
  }
`;

export const SummaryRail = styled.span`
  background: ${PALETTE.SMOKE_MAIN};
  border-radius: 3px;
  display: block;
  flex: 1 1 120px;
  height: 6px;
  max-width: 240px;
  min-width: 80px;
  overflow: hidden;

  > span {
    background: ${PALETTE.PRIMARY_MAIN};
    display: block;
    height: 100%;
    transition: width 200ms ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;
