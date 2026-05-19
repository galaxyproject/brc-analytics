import { AccordionProps } from "@mui/material";
import {
  Workflow,
  WorkflowCategory,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props extends Pick<AccordionProps, "disabled"> {
  configureRoute?: string;
  entityId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
