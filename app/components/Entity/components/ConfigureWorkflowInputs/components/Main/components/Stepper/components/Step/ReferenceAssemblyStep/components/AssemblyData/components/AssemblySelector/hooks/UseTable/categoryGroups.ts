import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES,
      CATEGORY_CONFIGS.TAXONOMIC_LEVEL_STRAIN,
      CATEGORY_CONFIGS.TAXONOMY_ID,
      CATEGORY_CONFIGS.PLOIDY,
      CATEGORY_CONFIGS.LINEAGE_TAXONOMY_IDS,
    ],
    label: "Organism",
  },
  {
    categoryConfigs: [
      CATEGORY_CONFIGS.ACCESSION,
      CATEGORY_CONFIGS.IS_REF,
      CATEGORY_CONFIGS.LEVEL,
      CATEGORY_CONFIGS.COVERAGE,
      CATEGORY_CONFIGS.ANNOTATION_STATUS,
    ],
    label: "Assembly",
  },
];
