import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
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

/* The window sentence on the left, the top pager on the right. Aligned to the
   top because the sentence can run to two lines and the pager should not
   drift down the toolbar with it. */
export const ResultsToolbar = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

/* Digits that sit in a column: coverage, ANI, the pagination caption. Inter
   has tabular figures; without them 0.8915 and 1.0000 are different widths
   and the column shimmers as the page changes. */
export const Numeric = styled.span`
  font-variant-numeric: tabular-nums;
`;

/* The coverage cell: a short rail proportional to the score, then the number.
   A fixed rail width rather than a share of the cell, so the bar means the
   same thing at every column width. */
export const CoverageCell = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const CoverageRail = styled.span`
  background: ${PALETTE.SMOKE_MAIN};
  border-radius: 3px;
  display: inline-block;
  height: 6px;
  overflow: hidden;
  width: 48px;

  > span {
    background: ${PALETTE.PRIMARY_MAIN};
    display: block;
    height: 100%;
  }
`;

/* Platform, country and release date leave the table below 720px and reappear
   as one line under the organism, so a phone gets a readable list rather than
   a seven-column scroll. Both are always in the DOM; CSS picks one. */
export const MetaCellStyles = `
  @media (max-width: 720px) {
    display: none;
  }
`;

export const OrganismMeta = styled.span`
  display: none;

  @media (max-width: 720px) {
    display: block;
  }
`;

/* The match count and its figures on the left, the export and the assistant
   on the right. Aligned to the top because the figures wrap to two rows on a
   narrow card and the buttons should not drift down with them. */
export const SummaryHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  justify-content: space-between;
`;

/* Actions stack on the right and align to the card's edge; on a narrow card
   they fall under the figures and align left with them. */
export const SummaryActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;

  @media (max-width: 720px) {
    align-items: flex-start;
  }
`;

/* Provenance under the headline: which job, which query, which indexes, and
   the way to hand any of it to someone else. */
export const SummaryMeta = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 12px;
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

/* The choropleth's box. A fixed height rather than an aspect ratio because
   the projection is fitted to the width and a world map at 1200px would
   otherwise be tall enough to push the counts beside it off screen. */
export const CohortMapContainer = styled.div`
  min-height: 320px;
  width: 100%;

  /* vega-embed renders into a child div and adds its own action menu, which
     we turn off; this keeps the drawing from overflowing a narrow column.
     Both element types are named because the renderer depends on the data --
     canvas once there are sampling points to draw, SVG when there are not. */
  canvas,
  svg {
    max-width: 100%;
  }
`;

/* Map left, the country bars right. Full width above the facet grid rather
   than inside it: at repeat(2, 1fr) on a 1200px page a cell is ~560px, which
   is too narrow for a world map to be worth drawing. */
export const CohortGeographyLayout = styled.div`
  display: grid;
  gap: 24px 40px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* One column per year, bars bottom-aligned in the 84px the row leaves above
   the labels. Chronological rather than ranked: a year is an axis, and
   sorting it by count throws away the only thing it was going to show. */
export const YearRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 3px;
  height: 104px;
  margin-top: 8px;
`;

export const YearColumn = styled.div`
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  height: 100%;
  justify-content: flex-end;
  min-width: 0;
`;

/* A year that rounds to nothing against the tallest still happened: 81 runs
   beside 402,118 is under half a pixel, and min-height is what keeps it on
   the axis at all. */
export const YearBar = styled.div`
  background: ${PALETTE.PRIMARY_MAIN};
  border-radius: 2px 2px 0 0;
  min-height: 1px;
`;

export const YearLabel = styled.span`
  color: ${PALETTE.INK_LIGHT};
  font-size: 11px;
  height: 20px;
  line-height: 20px;
  overflow: hidden;
  text-align: center;
  white-space: nowrap;
`;
