import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "@site-config/brc-analytics/category";

export const PRIORITY: ColumnConfig<
  BRCDataCatalogGenome | BRCDataCatalogOrganism
> = {
  componentConfig: { component: C.BasicCell, viewBuilder: V.buildPriority },
  enableHiding: true,
  header: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY,
  id: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY,
  width: "auto",
};
