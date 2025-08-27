import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_REGISTRY } from "../common/category/categoryRegistry";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.SPECIES,
      CATEGORY_REGISTRY.STRAIN,
      CATEGORY_REGISTRY.TAXONOMY_ID,
    ],
    label: "Organism",
  },
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.ACCESSION,
      CATEGORY_REGISTRY.IS_REF,
      CATEGORY_REGISTRY.LEVEL,
      CATEGORY_REGISTRY.COVERAGE,
      CATEGORY_REGISTRY.ANNOTATION_STATUS,
    ],
    label: "Assembly",
  },
];
