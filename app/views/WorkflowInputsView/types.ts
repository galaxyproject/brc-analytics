import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  entityId: string;
  genome: BRCDataCatalogGenome;
  workflow: Workflow;
}
