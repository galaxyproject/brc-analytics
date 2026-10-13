import { bpDownMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";
import type { ColumnProps } from "@repo/shared/views/AssistantView/components/Layout/types";

// A cell of the assistant layout grid: a column that scrolls on its own rather
// than growing the grid. On narrow screens only the active column shows, at
// its full height, and the page scrolls instead. Extend with
// `styled(StyledGridItem)` for column-specific styles.
export const StyledGridItem = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "active",
})<Pick<ColumnProps, "active">>`
  min-height: 0;
  overflow-y: auto;

  // Children keep their height so the column scrolls rather than squashing them.
  > * {
    flex-shrink: 0;
  }

  ${bpDownMd} {
    display: ${({ active }) => (active ? "flex" : "none")};
    overflow-y: visible;
  }
`;
