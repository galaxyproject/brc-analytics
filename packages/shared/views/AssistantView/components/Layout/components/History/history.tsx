import { type JSX } from "react";
import { StyledStack } from "./history.styles";
import type { Props } from "./types";

/**
 * Left column of the assistant layout, holding the sidebar. On narrow screens
 * it is the history tab.
 * @param props - History props.
 * @param props.children - Sidebar.
 * @returns History column.
 */
export const History = ({ children, ...props }: Props): JSX.Element => {
  return <StyledStack {...props}>{children}</StyledStack>;
};
