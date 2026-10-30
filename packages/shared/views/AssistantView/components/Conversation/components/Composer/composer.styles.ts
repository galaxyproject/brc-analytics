import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { InputBase, Stack } from "@mui/material";

export const StyledInputBase = styled(InputBase)`
  padding: 16px;

  textarea::placeholder {
    color: ${PALETTE.INK_LIGHT};
    opacity: 1;
  }
`;

export const StyledRoundedPaper = styled(RoundedPaper)`
  display: flex;
  flex-direction: column;

  &:focus-within {
    border-color: ${PALETTE.INK_MAIN};
  }
`;

export const StyledStack = styled(Stack)`
  justify-content: flex-end;
  padding: 8px;
`;
