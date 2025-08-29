/**
 * Names of columns that are expected to be in the TSV output by the initial build script, regardless of configuration.
 */
export const CORE_SOURCE_GENOME_KEYS = [
  "accession",
  "annotationStatus",
  "chromosomeCount",
  "commonName",
  "coverage",
  "gcPercent",
  "geneModelUrl",
  "isRef",
  "length",
  "level",
  "lineageTaxonomyIds",
  "scaffoldCount",
  "scaffoldL50",
  "scaffoldN50",
  "species",
  "speciesTaxonomyId",
  "strain",
  "taxonomyId",
  "ucscBrowser",
] as const;

export const SOURCE_GENOME_KEYS = [
  ...CORE_SOURCE_GENOME_KEYS,
  "otherTaxa",
  "taxonomicGroup",
  "taxonomicLevelClass",
  "taxonomicLevelFamily",
  "taxonomicLevelGenus",
  "taxonomicLevelKingdom",
  "taxonomicLevelOrder",
  "taxonomicLevelPhylum",
  "taxonomicLevelRealm",
  "taxonomicLevelSpecies",
  "taxonomicLevelStrain",
  "taxonomicLevelSerotype",
  "taxonomicLevelIsolate",
  "taxonomicLevelDomain",
] as const;
