import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
} from "../../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../../../category";
import * as C from "../../../../../../app/components";
import * as V from "../../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const PRIORITY: ColumnConfig<
  BRCDataCatalogGenome | BRCDataCatalogOrganism
> = {
  componentConfig: { component: C.BasicCell, viewBuilder: V.buildPriority },
  enableHiding: true,
  header: GA2_CATEGORY_LABEL.PRIORITY,
  id: GA2_CATEGORY_KEY.PRIORITY,
  width: "auto",
};
