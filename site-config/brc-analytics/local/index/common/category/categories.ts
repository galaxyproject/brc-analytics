import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_REGISTRY } from "./categoryRegistry";

export const CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  PRIORITY_PATHOGENS: {
    categoryConfigs: [
      CATEGORY_REGISTRY.PRIORITY_PATHOGEN_NAME,
      CATEGORY_REGISTRY.PRIORITY,
    ],
    label: "Priority Pathogens",
  },
};
