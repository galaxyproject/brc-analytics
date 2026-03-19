import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import type { ThemeProps } from "@databiosphere/findable-ui/lib/theme/types";
import { css, SerializedStyles } from "@emotion/react";

export const SECTION_PADDING = (theme: ThemeProps): SerializedStyles => css`
  padding: 20px;

  ${bpDownSm(theme)} {
    padding: 20px 16px;
  }
`;
