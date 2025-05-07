import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledRoundedPaper = styled(RoundedPaper)`
  background-color: ${PALETTE.SMOKE_MAIN};
  margin: 24px;
  max-height: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: auto;

  .MuiTableContainer-root {
    overflow: unset;

    .MuiTableHead-root {
      box-shadow: 0 1px 0 0 ${PALETTE.SMOKE_MAIN};
      position: sticky;
      top: 0;
      z-index: 1;
    }
  }
`;
