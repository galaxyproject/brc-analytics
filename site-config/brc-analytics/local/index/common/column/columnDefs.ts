import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import {
  type BRCDataCatalogGenome,
  type BRCDataCatalogOrganism,
} from "@brc/apis/types";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { type ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "@site-config/brc-analytics/category";

export const PRIORITY: ColumnConfig<
  BRCDataCatalogGenome | BRCDataCatalogOrganism
> = {
  componentConfig: { component: BasicCell, viewBuilder: V.buildPriority },
  enableHiding: true,
  header: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY,
  id: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY,
  width: "auto",
};
