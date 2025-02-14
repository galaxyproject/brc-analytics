import {
  Workflow,
  WorkflowCategory,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { Props as AnalysisMethodsProps } from "../AnalysisMethodsCatalog/types";

export interface Props extends AnalysisMethodsProps {
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
