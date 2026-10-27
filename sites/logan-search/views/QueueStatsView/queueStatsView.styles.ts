import styled from "@emotion/styled";

export const StatGrid = styled.div`
  display: grid;
  gap: 12px 24px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
`;

export const ChartBox = styled.div`
  margin-top: 16px;
  width: 100%;

  /* vega-embed sizes "container" width off this element. */
  .vega-embed {
    width: 100%;
  }
`;
