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
