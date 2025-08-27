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
  ncbiTaxonomyId: string;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  species: string;
  speciesTaxonomyId: string;
  sra_data: SRAData;
  strain: string | null;
  taxonomicGroup: string[];
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
