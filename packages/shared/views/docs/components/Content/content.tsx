import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { type JSX } from "react";
import { StyledSectionContent } from "./content.styles";
import { type Props } from "./types";

export const Content = ({ children, className }: Props): JSX.Element => {
  const { dimensions } = useLayoutDimensions();
  return (
    <StyledSectionContent
      className={className}
      offset={dimensions.header.height}
    >
      {children}
    </StyledSectionContent>
  );
};
