import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_REGISTRY } from "../common/category/categoryRegistry";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.SPECIES,
      CATEGORY_REGISTRY.ASSEMBLY_TAXONOMY_IDS,
    ],
  },
];
