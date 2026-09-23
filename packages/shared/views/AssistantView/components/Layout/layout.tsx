import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { type JSX } from "react";
import { Chat } from "./components/Chat/chat";
import { History } from "./components/History/history";
import { Setup } from "./components/Setup/setup";
import { StyledLayout } from "./layout.styles";
import type { LayoutProps } from "./types";

/**
 * Three-column assistant layout (history, chat, analysis setup) filling the
 * viewport between the header and footer, rendered while the assistant-ui
 * feature flag is on. Columns stack on narrow screens.
 * @param props - Layout props.
 * @param props.slotProps - Props for each column.
 * @returns Three-column assistant layout.
 */
export const Layout = ({ slotProps }: LayoutProps): JSX.Element => {
  const { spacing } = useLayoutSpacing();
  return (
    <StyledLayout {...spacing}>
      <History {...slotProps.history} />
      <Chat {...slotProps.chat} />
      <Setup {...slotProps.setup} />
    </StyledLayout>
  );
};
