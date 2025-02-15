import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  workflow: Workflow;
}
