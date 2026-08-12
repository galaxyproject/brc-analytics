import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import type { ThemeProps } from "@databiosphere/findable-ui/lib/theme/types";
import { css, type SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";

export const SECTION_PADDING = (theme: ThemeProps): SerializedStyles => css`
  padding: 20px;

  ${bpDownSm(theme)} {
    padding: 20px 16px;
  }
`;

export const StyledFluidPaper = styled(FluidPaper)`
  background-color: ${PALETTE.SMOKE_MAIN};
  display: grid;
  gap: 1px;
`;
