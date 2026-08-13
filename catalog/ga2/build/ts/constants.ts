import { CORE_SOURCE_GENOME_KEYS } from "../../../build/ts/constants";

export const SOURCE_GENOME_KEYS = [
  ...CORE_SOURCE_GENOME_KEYS,
  "organismImageCredit",
  "organismImageLicense",
  "organismImageSourceName",
  "organismImageSourceUrl",
  "organismImageUrl",
  "organismThumbnailUrl",
  "taxonomicGroup",
  "taxonomicLevelClass",
  "taxonomicLevelDomain",
  "taxonomicLevelFamily",
  "taxonomicLevelGenus",
  "taxonomicLevelKingdom",
  "taxonomicLevelOrder",
  "taxonomicLevelPhylum",
  "taxonomicLevelSpecies",
  "taxonomicLevelStrain",
  "tolId",
] as const;
