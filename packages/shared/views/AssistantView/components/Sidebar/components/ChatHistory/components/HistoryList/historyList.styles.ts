import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { List } from "@mui/material";

export const StyledList = styled(List)`
  margin: 0 -8px;

  .MuiListItemButton-root {
    border-radius: 4px;
    // Shrinks to its list item (MUI's own flex doesn't), so a long title
    // truncates with an ellipsis rather than overflowing the sidebar.
    flex-shrink: 1;
    padding: 6px 8px;

    &:hover {
      background-color: ${PALETTE.SMOKE_LIGHTEST};
    }

    &.Mui-selected,
    &.Mui-selected:hover {
      background-color: ${PALETTE.SMOKE_MAIN};
    }
  }
`;
