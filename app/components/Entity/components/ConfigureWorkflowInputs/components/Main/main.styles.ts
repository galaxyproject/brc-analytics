import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Button } from "@mui/material";
import { SECTION_PADDING } from "@repo/shared/views/EntityView/ui/styles";

export const StyledMainContainer = styled.div`
  display: grid;
  gap: 16px;
  grid-column: 1 / -1;
  grid-template-columns: inherit;

  .MuiPaper-panel {
    &:not(.MuiStep-root) {
      box-shadow: none;
    }
  }
`;

export const StyledFluidPaper = styled(FluidPaper)`
  ${SECTION_PADDING};
`;

export const StyledButton = styled(Button)`
  grid-column: 1 / -1;
  justify-self: flex-start;

  ${bpDownSm} {
    margin: 0 16px;
  }
`;
