import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../../../category";
import { mapSelectCategoryValue } from "./mapSelectCategoryValue";
import { mapPriority, mapPriorityPathogenName } from "./utils";

export const PRIORITY: CategoryConfig = {
  key: GA2_CATEGORY_KEY.PRIORITY,
  label: GA2_CATEGORY_LABEL.PRIORITY,
  mapSelectCategoryValue: mapSelectCategoryValue(mapPriority),
};

export const PRIORITY_PATHOGEN_NAME: CategoryConfig = {
  key: GA2_CATEGORY_KEY.PRIORITY_PATHOGEN_NAME,
  label: GA2_CATEGORY_LABEL.PRIORITY_PATHOGEN_NAME,
  mapSelectCategoryValue: mapSelectCategoryValue(mapPriorityPathogenName),
};
