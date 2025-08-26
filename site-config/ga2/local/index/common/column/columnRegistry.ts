import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as COLUMN_DEFS from "./columnDefs";

export const COLUMN_REGISTRY: Record<
  string,
  ColumnConfig<BRCDataCatalogOrganism | BRCDataCatalogGenome>
> = {
  PRIORITY: COLUMN_DEFS.PRIORITY,
};
