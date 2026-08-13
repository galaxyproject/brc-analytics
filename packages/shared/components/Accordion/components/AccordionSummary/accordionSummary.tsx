import { AddIcon as DXAddIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/AddIcon/addIcon";
import {
  AccordionSummary as MAccordionSummary,
  type AccordionSummaryProps as MAccordionSummaryProps,
} from "@mui/material";
import { type JSX } from "react";

export const AccordionSummary = ({
  children,
  expandIcon = <DXAddIcon color="inkLight" fontSize="small" />,
  ...props
}: MAccordionSummaryProps): JSX.Element => {
  return (
    <MAccordionSummary expandIcon={expandIcon} {...props}>
      {children}
    </MAccordionSummary>
  );
};
