import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_REGISTRY } from "../common/category/categoryRegistry";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_SPECIES,
      CATEGORY_REGISTRY.TAXONOMY_ID,
    ],
    label: "Organism",
  },
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_DOMAIN,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_KINGDOM,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_PHYLUM,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_CLASS,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_ORDER,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_FAMILY,
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_GENUS,
    ],
    label: "Taxonomic Lineage",
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
