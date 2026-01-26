import { JSX } from "react";
import {
  getBorderBoxSize,
  useResizeObserver,
} from "@databiosphere/findable-ui/lib/hooks/useResizeObserver";
import { useRef } from "react";
import { StyledSection } from "./section.styles";

export interface SectionProps {
  children: (height?: number, width?: number) => JSX.Element;
  className?: string;
}

export const Section = ({ children, className }: SectionProps): JSX.Element => {
  const sectionRef = useRef<HTMLElement>(null);
  const { height, width } =
    useResizeObserver(sectionRef, getBorderBoxSize) || {};
  return (
    <StyledSection className={className} ref={sectionRef}>
      {children?.(height, width)}
    </StyledSection>
  );
};
