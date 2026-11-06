import { HEADER_HEIGHT_VAR } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/constants";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import {
  bpDownMd,
  bpUpMd,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import {
  pinned,
  pinnedFocus,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/pinned";
import { css, type SerializedStyles, type Theme } from "@emotion/react";
import styled from "@emotion/styled";
import { Tabs } from "@mui/material";
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_HEIGHT_PROPERTY,
} from "@repo/shared/views/AssistantView/components/Layout/constants";

// Pinned beneath the header while the page scrolls the active tab, and
// hidden on wider screens, where the columns sit side by side. Its tabs sit
// inside the page's scroll padding; `pinnedFocus` is there so focusing one
// doesn't scroll the page, though findable-ui's compiled selector doesn't
// reach the tabs yet.
// Its padding and the track and tab padding in `StyledTabs` add up to the
// `TAB_BAR_HEIGHT` fallback; update it when they change.
export const StyledTabBar = styled("div")`
  background-color: ${PALETTE.COMMON_WHITE};
  padding: 16px;
  ${pinned(HEADER_HEIGHT_VAR)};
  ${pinnedFocus};
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

/**
 * On narrow screens the tab bar pins beneath the header, so focus and scrolling
 * into view stop below the tab bar too. Wider screens hide the tab bar and keep
 * the header's scroll padding. `:root` outranks the header's `html` scroll
 * padding.
 * @param theme - MUI theme.
 * @returns Global scroll padding styles for the tab bar.
 */
export const tabBarScrollPadding = (theme: Theme): SerializedStyles => css`
  ${bpDownMd({ theme })} {
    :root {
      scroll-padding-top: calc(
        ${HEADER_HEIGHT_VAR} +
          var(${TAB_BAR_HEIGHT_PROPERTY}, ${TAB_BAR_HEIGHT}px)
      );
    }
  }
`;
