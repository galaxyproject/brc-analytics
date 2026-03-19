import type { CategoryGroupConfig } from "@databiosphere/findable-ui/lib/config/entities";

export const CATEGORY_CONFIG = {
  CATEGORY: { key: "category", label: "Category" },
  COMMON_NAME: { key: "assembly.commonName", label: "Common Name" },
  PLOIDY: { key: "ploidy", label: "Ploidy" },
  TAXONOMIC_LEVEL_CLASS: {
    key: "assembly.taxonomicLevelClass",
    label: "Class",
  },
  TAXONOMIC_LEVEL_DOMAIN: {
    key: "assembly.taxonomicLevelDomain",
    label: "Domain",
  },
  TAXONOMIC_LEVEL_FAMILY: {
    key: "assembly.taxonomicLevelFamily",
    label: "Family",
  },
  TAXONOMIC_LEVEL_GENUS: {
    key: "assembly.taxonomicLevelGenus",
    label: "Genus",
  },
  TAXONOMIC_LEVEL_KINGDOM: {
    key: "assembly.taxonomicLevelKingdom",
    label: "Kingdom",
  },
  TAXONOMIC_LEVEL_ORDER: {
    key: "assembly.taxonomicLevelOrder",
    label: "Order",
  },
  TAXONOMIC_LEVEL_PHYLUM: {
    key: "assembly.taxonomicLevelPhylum",
    label: "Phylum",
  },
  TAXONOMIC_LEVEL_REALM: {
    key: "assembly.taxonomicLevelRealm",
    label: "Realm",
  },
  TAXONOMIC_LEVEL_SPECIES: {
    key: "assembly.taxonomicLevelSpecies",
    label: "Species",
  },
  TAXONOMY_ID: { key: "taxonomyId", label: "Taxonomy ID" },
  WORKFLOW_NAME: { key: "workflowName", label: "Workflow" },
} as const;

export const CATEGORY_GROUP_CONFIG: CategoryGroupConfig = {
  categoryGroups: [
    {
      categoryConfigs: [
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_SPECIES,
        CATEGORY_CONFIG.COMMON_NAME,
        CATEGORY_CONFIG.TAXONOMY_ID,
        CATEGORY_CONFIG.WORKFLOW_NAME,
        CATEGORY_CONFIG.CATEGORY,
        CATEGORY_CONFIG.PLOIDY,
      ],
    },
    {
      categoryConfigs: [
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_GENUS,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_FAMILY,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_ORDER,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_CLASS,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_PHYLUM,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_KINGDOM,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_REALM,
        CATEGORY_CONFIG.TAXONOMIC_LEVEL_DOMAIN,
      ],
      label: "Taxonomic Lineage",
    },
  ],
  key: "workflow",
};
