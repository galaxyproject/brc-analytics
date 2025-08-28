export type GA2Catalog = GA2AssemblyEntity | GA2OrganismEntity;

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
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  speciesTaxonomyId: string;
  sra_data: SRAData[];
  strain: string | null;
  taxonomicGroup: string[];
  taxonomicLevelSpecies: string;
  tolId: string;
  ucscBrowserUrl: string | null;
}

export interface GA2OrganismEntity {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  genomes: GA2AssemblyEntity[];
  maxScaffoldN50: number | null;
  ncbiTaxonomyId: string;
  taxonomicGroup: string[];
  taxonomicLevelSpecies: string;
  tolId: string;
}

export interface SRAData {
  accession: string;
  biosample: string;
  instrument: string;
  library_layout: string;
  library_source: string;
  library_strategy: string;
  platform: string;
  run_total_bases: number | null;
  sra_run_acc: string;
  sra_sample_acc: string;
  sra_study_acc: string;
  total_bases: number | null;
}
