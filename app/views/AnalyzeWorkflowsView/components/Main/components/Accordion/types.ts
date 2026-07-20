import type {
  Workflow,
  WorkflowCategory,
} from "@brc-analytics/core/apis/workflow";
import { AccordionProps } from "@mui/material";

export interface Props extends Pick<AccordionProps, "disabled"> {
  configureRoute?: string;
  entityId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
