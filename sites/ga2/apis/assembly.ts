import type { ORGANISM_PLOIDY } from "@repo/shared/apis/schema-types";

export interface GA2AssemblyEntity {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  coverage: string | null;
  galaxyDatacacheUrl: string | null;
  gcPercent: number | null;
  geneModelUrl: string | null;
  image: ImageData | null;
  isRef: "No" | "Yes";
  length: number;
  level: string;
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  ploidy: ORGANISM_PLOIDY[];
  releaseDate: string;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  speciesTaxonomyId: string;
  strainName: string | null;
  taxonomicGroup: string[];
  taxonomicLevelClass: string;
  taxonomicLevelDomain: string;
  taxonomicLevelFamily: string;
  taxonomicLevelGenus: string;
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
  thumbnailUrl: string | null;
  tolId: string;
  ucscBrowserUrl: string | null;
}

export interface ImageData {
  credit: string | null;
  license: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  url: string;
}
