import { CategoryGroup } from "@databiosphere/findable-ui/lib/config/entities";
import { CATEGORY_REGISTRY } from "../common/category/categoryRegistry";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    categoryConfigs: [
      CATEGORY_REGISTRY.TAXONOMIC_LEVEL_SPECIES,
      CATEGORY_REGISTRY.ASSEMBLY_TAXONOMY_IDS,
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
];
