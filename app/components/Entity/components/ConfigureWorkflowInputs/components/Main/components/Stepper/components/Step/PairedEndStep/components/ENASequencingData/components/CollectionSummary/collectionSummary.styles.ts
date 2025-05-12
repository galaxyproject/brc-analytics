import styled from "@emotion/styled";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledPaper = styled(RoundedPaper)`
  width: 100%;

  .MuiToolbar-table {
    background-color: ${PALETTE.COMMON_WHITE};
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding: 16px;
  }
`;
