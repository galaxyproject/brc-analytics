import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

export const StyledRoundedPaper = styled(RoundedPaper)`
  .MuiListItem-root + .MuiListItem-root {
    border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  }

  .MuiListItemButton-root {
    align-items: flex-start;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 16px;

    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};
    }
  }
`;

export const StyledStack = styled(Stack)`
  gap: 8px;
`;
