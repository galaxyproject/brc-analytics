import { ORGANISM_PLOIDY } from "../brc-analytics-catalog/common/schema-entities";

export type GA2Catalog = GA2AssemblyEntity | GA2OrganismEntity;

/**
 * TODO: Confirm the shape of Assembly and Organism entities, including sra_data.
 */

export interface GA2AssemblyEntity {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  coverage: string | null;
  gcPercent: number | null;
  geneModelUrl: string | null;
  isRef: "No" | "Yes";
  length: number;
  level: string;
  lineageTaxonomyIds: string[]; // TODO: Add to API.
  ncbiTaxonomyId: string;
  ploidy: ORGANISM_PLOIDY[]; // TODO: Add to API.
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  species: string;
  speciesTaxonomyId: string;
  sra_data: SRAData;
  strain: string | null;
  taxonomicGroup: string[];
  taxonomicLevelSpecies: string; // TODO: Add to API.
  taxonomicLevelStrain: string; // TODO: Add to API.
  tolId: string;
  ucscBrowserUrl: string | null;
}

export interface GA2OrganismEntity {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  genomes: GA2AssemblyEntity[];
  maxScaffoldN50: number;
  ncbiTaxonomyId: string;
  species: string;
  taxonomicGroup: string[];
  tolId: string;
}

/**
 * TODO: Confirm the shape of SRAData.
 */

export interface SRAData {
  accession: string;
}
