import { css } from "@emotion/react";

export const headline = css`
  h2 {
    font-family: "Inter Tight", sans-serif;
    font-size: 32px;
    font-weight: 500;
    line-height: 40px;
    margin: 0;

    + div {
      margin-top: 16px; /* TODO(cc) duplication of SectionHeadline class in SubHeadline */
    }
  }
`;
