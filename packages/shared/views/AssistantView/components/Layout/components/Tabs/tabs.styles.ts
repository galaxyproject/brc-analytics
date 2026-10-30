import { HEADER_HEIGHT_VAR } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/constants";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import { bpUpMd } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { pinned } from "@databiosphere/findable-ui/lib/styles/common/mixins/pinned";
import styled from "@emotion/styled";
import { Tabs } from "@mui/material";

// Pinned beneath the header while the page scrolls the active tab, and
// hidden on wider screens, where the columns sit side by side.
export const StyledTabBar = styled("div")`
  background-color: ${PALETTE.COMMON_WHITE};
  padding: 16px;
  ${pinned(HEADER_HEIGHT_VAR)};
  z-index: 1;

  ${bpUpMd} {
    display: none;
  }
`;

// A segmented control rather than the theme's underlined tabs. Doubled class
// selectors outrank the theme's tab hover and underline styles.
export const StyledTabs = styled(Tabs)`
  && {
    background-color: ${PALETTE.SMOKE_MAIN};
    border-radius: 6px;
    box-shadow: none;
    padding: 2px;

    .MuiTabs-scroller {
      padding: 0;
    }

    .MuiTabs-flexContainer {
      gap: 0;
    }

    .MuiTabs-indicator {
      display: none;
    }

    .MuiTab-root {
      border-radius: 4px;
      flex-direction: row;
      gap: 4px;
      margin: 0;
      padding: 6px 8px;
      text-transform: none;
      white-space: nowrap;

      &::after {
        content: none;
      }

      &.Mui-selected {
        background-color: ${PALETTE.COMMON_WHITE};
        box-shadow: ${SHADOWS["01"]};
      }
    }
  }
`;
