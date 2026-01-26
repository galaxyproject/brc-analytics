import { JSX } from "react";
import { RoundedPaper as DXRoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { AccordionProps as MAccordionProps } from "@mui/material";
import { StyledAccordion } from "./accordion.styles";

export const Accordion = ({
  children,
  component = DXRoundedPaper,
  ...props
}: MAccordionProps): JSX.Element => {
  return (
    <StyledAccordion component={component} {...props}>
      {children}
    </StyledAccordion>
  );
};
