import { type CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES,
      CATEGORY_CONFIGS.TAXONOMIC_GROUP,
      CATEGORY_CONFIGS.TAXONOMY_ID,
    ],
    label: "Organism",
  },
];
