import {
  type BRCDataCatalogGenome,
  type BRCDataCatalogOrganism,
} from "@brc/apis/types";
import { type ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as COLUMN_DEFS from "./columnDefs";

export const COLUMN_REGISTRY: Record<
  string,
  ColumnConfig<BRCDataCatalogOrganism | BRCDataCatalogGenome>
> = {
  PRIORITY: COLUMN_DEFS.PRIORITY,
};
