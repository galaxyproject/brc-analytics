import styled from "@emotion/styled";
import { RadioGroup } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const StyledRadioGroup = styled(RadioGroup)`
  align-items: stretch;
  gap: 8px;
  width: 100%;

  .MuiFormControlLabel-root {
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px ${PALETTE.SMOKE_MAIN};
    gap: 16px;
    padding: 16px;
  }
`;
