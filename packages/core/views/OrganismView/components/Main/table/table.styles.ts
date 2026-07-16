import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const StyledFluidPaper = styled(FluidPaper)`
  display: grid;
  flex: 1;
  max-height: 100%;

  .MuiTableContainer-root {
    background-color: ${PALETTE.SMOKE_MAIN};
    height: 100%;
  }
`;
