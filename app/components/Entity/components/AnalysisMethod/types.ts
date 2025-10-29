import { AccordionProps } from "@mui/material";
import {
  Workflow,
  WorkflowCategory,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props
  extends Pick<AccordionProps, "defaultExpanded" | "disabled"> {
  entityId: string;
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
