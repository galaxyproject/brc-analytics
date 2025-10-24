import { ReactNode } from "react";
import { StyledSectionContent } from "./content.styles";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";

export interface ContentProps {
  children: ReactNode | ReactNode[];
}

export const Content = ({ children }: ContentProps): JSX.Element => {
  const { dimensions } = useLayoutDimensions();
  return (
    <StyledSectionContent offset={dimensions.header.height}>
      {children}
    </StyledSectionContent>
  );
};
