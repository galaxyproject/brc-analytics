import { css } from "@emotion/react";

export const section = css`
  width: 100%;
`;

export const sectionGrid = css`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);
`;

export const sectionLayout = css`
  box-sizing: content-box;
  margin: 0 auto;
  max-width: 1136px;
`;
