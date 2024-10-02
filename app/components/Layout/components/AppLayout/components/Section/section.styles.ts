import {
  smokeMain,
  white,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/colors";
import { ThemeProps } from "@databiosphere/findable-ui/lib/theme/theme";
import { css } from "@emotion/react";

export const section = css`
  width: 100%;
`;

export const sectionGrid = css`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);
`;

export const sectionGridAreas = css`
  grid-template-areas: "feature feature feature feature . detail detail detail detail detail detail detail";
`;

export const sectionLayout = css`
  box-sizing: content-box;
  margin: 0 auto;
  max-width: 1136px;
`;

export const sectionSubHero = (props: ThemeProps) => css`
  ${section};
  background-color: ${white(props)};
  border-top: 1px solid ${smokeMain(props)};
`;

export const sectionWithDivider = (props: ThemeProps) => css`
  position: relative; /* positions divider */
  width: 100%;

  > div:before {
    background-color: ${smokeMain(props)};
    content: "";
    height: 1px;
    max-width: min(1136px, calc(100vw - 32px));
    position: absolute;
    top: 0;
    width: 100%;
  }
`;

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
