import { type JSX } from "react";
import { StyledStack } from "./setup.styles";
import type { Props } from "./types";

/**
 * Right column of the assistant layout, holding the analysis setup.
 * @param props - Setup props.
 * @param props.children - Analysis setup panel.
 * @returns Setup column.
 */
export const Setup = ({ children }: Props): JSX.Element => {
  return <StyledStack>{children}</StyledStack>;
};
