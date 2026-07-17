import {
  getBorderBoxSize,
  useResizeObserver,
} from "@databiosphere/findable-ui/lib/hooks/useResizeObserver";
import { JSX, useRef } from "react";
import { StyledSection } from "./section.styles";
import { Props } from "./types";

export const Section = ({ children, className }: Props): JSX.Element => {
  const sectionRef = useRef<HTMLElement>(null);
  const { height, width } =
    useResizeObserver(sectionRef, getBorderBoxSize) || {};
  return (
    <StyledSection className={className} ref={sectionRef}>
      {children?.(height, width)}
    </StyledSection>
  );
};
