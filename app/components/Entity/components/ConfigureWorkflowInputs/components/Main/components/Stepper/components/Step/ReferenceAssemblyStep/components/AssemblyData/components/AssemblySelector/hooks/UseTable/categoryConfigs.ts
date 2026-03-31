import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  ACCESSION: {
    key: "accession",
    label: "Accession",
  },
  ANNOTATION_STATUS: {
    key: "annotationStatus",
    label: "Annotation Status",
  },
  CHROMOSOMES: {
    key: "chromosomes",
    label: "Chromosomes",
  },
  COVERAGE: {
    key: "coverage",
    label: "Coverage",
  },
  GALAXY_DATACACHE_URL: {
    key: "galaxyDatacacheUrl",
    label: "Galaxy Data Cache Available",
  },
  GC_PERCENT: {
    key: "gcPercent",
    label: "GC%",
  },
  IS_REF: {
    key: "isRef",
    label: "Is Ref",
  },
  LENGTH: {
    key: "length",
    label: "Length",
  },
  LEVEL: {
    key: "level",
    label: "Level",
  },
  LINEAGE_TAXONOMY_IDS: {
    key: "lineageTaxonomyIds",
    label: "Lineage Taxonomy Ids",
  },
  PLOIDY: {
    key: "ploidy",
    label: "Ploidy",
  },
  SCAFFOLD_COUNT: {
    key: "scaffoldCount",
    label: "Scaffolds",
  },
  SCAFFOLD_L50: {
    key: "scaffoldL50",
    label: "Scaffold L50",
  },
  SCAFFOLD_N50: {
    key: "scaffoldN50",
    label: "Scaffold N50",
  },
  TAXONOMIC_GROUP: {
    key: "taxonomicGroup",
    label: "Taxonomic Group",
  },
  TAXONOMIC_LEVEL_SPECIES: {
    key: "taxonomicLevelSpecies",
    label: "Species",
  },
  TAXONOMIC_LEVEL_STRAIN: {
    key: "taxonomicLevelStrain",
    label: "Strain",
  },
  TAXONOMY_ID: {
    key: "ncbiTaxonomyId",
    label: "Taxonomy ID",
  },
} as const;
