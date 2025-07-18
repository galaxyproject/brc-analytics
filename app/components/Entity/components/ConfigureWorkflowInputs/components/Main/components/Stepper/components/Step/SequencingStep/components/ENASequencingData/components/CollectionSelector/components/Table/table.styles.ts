import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledRoundedPaper = styled(RoundedPaper)`
  background-color: ${PALETTE.SMOKE_MAIN};
  margin: 24px;
  max-height: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;

  .MuiTableContainer-root {
    height: 100%;

    .MuiTableCell-root {
      word-break: break-word;
    }
  }
`;
