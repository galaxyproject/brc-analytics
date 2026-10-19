import { type CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";

export const CATEGORY_CONFIGS = {
  ASSEMBLY_COUNT: {
    key: "assemblyCount",
    label: "Assemblies",
  },
  TAXONOMIC_GROUP: {
    key: "taxonomicGroup",
    label: "Taxonomic Group",
  },
  TAXONOMIC_LEVEL_SPECIES: {
    key: "taxonomicLevelSpecies",
    label: "Species",
  },
  TAXONOMY_ID: {
    key: "ncbiTaxonomyId",
    label: "Taxonomy ID",
  },
} as const satisfies Record<string, CategoryConfig>;
