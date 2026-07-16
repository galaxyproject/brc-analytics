import { StackProps } from "@mui/material";
import { JSX } from "react";
import { StyledStack } from "./section.styles";

/**
 * Renders a section component.
 * @param props - Props.
 * @returns Section component.
 */
export const Section = (props: StackProps): JSX.Element => {
  return <StyledStack useFlexGap {...props} />;
};
