import {
  Workflow,
  WorkflowCategory,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { AccordionProps } from "@mui/material";

export interface Props extends Pick<AccordionProps, "disabled"> {
  configureRoute?: string;
  entityId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
