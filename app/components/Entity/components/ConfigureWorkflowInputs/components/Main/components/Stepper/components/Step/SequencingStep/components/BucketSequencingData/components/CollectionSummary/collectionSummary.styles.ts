import styled from "@emotion/styled";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledRoundedPaper = styled(RoundedPaper)`
  background-color: ${PALETTE.SMOKE_MAIN};
  display: grid;
  gap: 1px;
  width: 100%;

  .MuiToolbar-table {
    background-color: ${PALETTE.COMMON_WHITE};
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding: 16px;
  }
`;
