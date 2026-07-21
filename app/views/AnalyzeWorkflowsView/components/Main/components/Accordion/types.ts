import { AccordionProps } from "@mui/material";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";

export interface Props extends Pick<AccordionProps, "disabled"> {
  configureRoute?: string;
  entityId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
