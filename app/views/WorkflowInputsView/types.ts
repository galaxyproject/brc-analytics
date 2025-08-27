import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../apis/catalog/ga2/entities";

export interface Props {
  entityId: string;
  genome: BRCDataCatalogGenome | GA2AssemblyEntity;
  workflow: Workflow;
}
