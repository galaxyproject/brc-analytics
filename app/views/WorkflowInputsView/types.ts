import { BRCDataCatalogGenome } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../apis/catalog/ga2/entities";

export type Assembly = BRCDataCatalogGenome | GA2AssemblyEntity;

export interface Props {
  entityId: string;
  entityListType: string;
  trsId: string;
}
