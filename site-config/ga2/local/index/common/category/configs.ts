import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import {
  BRC_DATA_CATALOG_CATEGORY_KEY,
  BRC_DATA_CATALOG_CATEGORY_LABEL,
} from "../../../../category";
import { mapSelectCategoryValue } from "./mapSelectCategoryValue";
import { mapPriority, mapPriorityPathogenName } from "./utils";

export const PRIORITY: CategoryConfig = {
  key: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY,
  label: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY,
  mapSelectCategoryValue: mapSelectCategoryValue(mapPriority),
};

export const PRIORITY_PATHOGEN_NAME: CategoryConfig = {
  key: BRC_DATA_CATALOG_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
  label: BRC_DATA_CATALOG_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
  mapSelectCategoryValue: mapSelectCategoryValue(mapPriorityPathogenName),
};
