import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism;
}
