import { Beta } from "@databiosphere/findable-ui/lib/components/common/Chip/components/Beta/beta";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

export const StyledBeta = styled(Beta)`
  height: auto;

  .MuiChip-label {
    padding: 2px 5px;
  }
`;

export const StyledStack = styled(Stack)`
  align-items: center;
  gap: 4px;
`;
