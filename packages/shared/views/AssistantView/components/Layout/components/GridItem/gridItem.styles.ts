import styled from "@emotion/styled";
import { Stack } from "@mui/material";

/**
 * A cell of the assistant layout grid: a column that scrolls on its own
 * rather than growing the grid. Extend with `styled(StyledGridItem)` for
 * column-specific styles.
 */
export const StyledGridItem = styled(Stack)`
  min-height: 0;
  overflow-y: auto;

  // Children keep their height so the column scrolls rather than squashing them.
  > * {
    flex-shrink: 0;
  }
`;
