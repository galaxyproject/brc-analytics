import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  entityId: string;
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  isFeatureEnabled: boolean;
  workflow: Workflow;
}
