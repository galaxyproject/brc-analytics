import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import styled from "@emotion/styled";
import { Chip } from "@mui/material";

export const StyledChip = styled(Chip)`
  padding: 0 8px;

  .MuiChip-label {
    font: ${FONT.BODY_SMALL_500};
    padding: 0;
  }

  .MuiChip-deleteIcon {
    font-size: 16px;
    margin-left: 2px;
  }

  &.Mui-disabled {
    opacity: 1;

    .MuiChip-deleteIcon {
      opacity: 0.38;
    }
  }
`;

// Tooltip anchor: a disabled chip takes no pointer events, so the tooltip
// listens on this wrapper instead.
export const StyledSpan = styled("span")`
  display: flex;
  min-width: 0;
`;
