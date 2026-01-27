import styled from "@emotion/styled";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledFluidPaper = styled(FluidPaper)`
  & {
    align-self: flex-start;
    display: grid;
    gap: 16px;
    grid-column: 9 / -1;
    padding: 20px;

    ${bpDownSm} {
      grid-column: 1 / 9;
      padding: 20px 16px;
    }

    .MuiSvgIcon-colorError {
      color: ${PALETTE.ALERT_MAIN};
    }
  }
`;
