import { type JSX } from "react";
import { StyledStack } from "./history.styles";
import type { Props } from "./types";

/**
 * Left column of the assistant layout, holding the sidebar. On narrow screens
 * the columns simply stack, with this one above the chat.
 * @param props - History props.
 * @param props.children - Sidebar.
 * @returns History column.
 */
export const History = ({ children }: Props): JSX.Element => {
  return <StyledStack>{children}</StyledStack>;
};
