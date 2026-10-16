import {
  BREAKPOINT_FN_NAME,
  useBreakpointHelper,
} from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { type JSX, useId } from "react";
import { Chat } from "./components/Chat/chat";
import { History } from "./components/History/history";
import { Setup } from "./components/Setup/setup";
import { Tabs } from "./components/Tabs/tabs";
import { DEFAULT_HEIGHT, LAYOUT_TAB } from "./constants";
import { SelectTabContext } from "./context";
import { useLayoutTab } from "./hooks/UseLayoutTab/hook";
import { StyledLayout } from "./layout.styles";
import type { LayoutProps } from "./types";
import { buildTabs, getTabPanelProps } from "./utils";

/**
 * Three-column assistant layout (history, chat, analysis setup) filling the
 * viewport between the header and footer, rendered while the assistant-ui
 * feature flag is on. On narrow screens the columns become tabs, one showing
 * at a time, starting on the chat, and the page scrolls the active one beneath
 * the pinned tabs. Every column stays mounted, so switching tabs keeps any
 * unsent draft. History and setup return to where they were scrolled; the
 * chat returns to its newest message. Content inside a column can switch
 * column through `useSelectTab`.
 * @param props - Layout props.
 * @param props.conversationKey - Key that changes when the user moves to a different conversation, bringing the chat tab back.
 * @param props.slotProps - Content and tab label for each column.
 * @returns Three-column assistant layout.
 */
export const Layout = ({
  conversationKey,
  slotProps,
}: LayoutProps): JSX.Element => {
  const { spacing } = useLayoutSpacing();
  const isTabbed = useBreakpointHelper(BREAKPOINT_FN_NAME.DOWN, "md");
  const baseId = useId();
  const { onSelectTab, onTabChange, tab } = useLayoutTab(
    conversationKey,
    baseId
  );
  const top = spacing.top || DEFAULT_HEIGHT.TOP;

  return (
    <SelectTabContext.Provider value={onSelectTab}>
      <StyledLayout bottom={spacing.bottom || DEFAULT_HEIGHT.BOTTOM} top={top}>
        <Tabs
          baseId={baseId}
          onTabChange={onTabChange}
          tabs={buildTabs(slotProps)}
          top={top}
          value={tab}
        />
        <History
          active={tab === LAYOUT_TAB.HISTORY}
          {...getTabPanelProps(baseId, LAYOUT_TAB.HISTORY, isTabbed)}
        >
          {slotProps.history.children}
        </History>
        <Chat
          active={tab === LAYOUT_TAB.CHAT}
          {...getTabPanelProps(baseId, LAYOUT_TAB.CHAT, isTabbed)}
        >
          {slotProps.chat.children}
        </Chat>
        <Setup
          active={tab === LAYOUT_TAB.SETUP}
          {...getTabPanelProps(baseId, LAYOUT_TAB.SETUP, isTabbed)}
        >
          {slotProps.setup.children}
        </Setup>
      </StyledLayout>
    </SelectTabContext.Provider>
  );
};
