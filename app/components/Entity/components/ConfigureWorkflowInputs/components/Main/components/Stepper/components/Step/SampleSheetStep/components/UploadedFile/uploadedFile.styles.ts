import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import styled from "@emotion/styled";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledRoundedPaper = styled(RoundedPaper)`
  align-items: center;
  border-radius: 4px;
  display: flex;
  gap: 16px;
  padding: 16px;
  width: 100%;

  .MuiSvgIcon-root {
    color: ${PALETTE.INK_LIGHT};
  }
`;
