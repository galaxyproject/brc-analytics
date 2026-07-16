import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";

export const StyledFluidPaper = styled(FluidPaper)`
  display: grid;
  flex: 1;

  .MuiToolbar-root {
    border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
    display: block;
    padding: 20px;

    .MuiList-root {
      list-style-type: disc;
      padding-left: 24px;

      .MuiListItem-root {
        display: list-item;
        color: ${PALETTE.INK_LIGHT};
        font: ${FONT.BODY_400_2_LINES};
      }
    }
  }

  .MuiTableContainer-root {
    background-color: ${PALETTE.SMOKE_MAIN};
  }
`;
