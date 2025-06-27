import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import * as CATEGORY_CONFIG from "./configs";

export const CATEGORY_REGISTRY: Record<string, CategoryConfig> = {
  PRIORITY: CATEGORY_CONFIG.PRIORITY,
  PRIORITY_PATHOGEN_NAME: CATEGORY_CONFIG.PRIORITY_PATHOGEN_NAME,
};
