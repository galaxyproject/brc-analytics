export enum ANALYSIS_METHOD {
  ASSEMBLY = "ASSEMBLY",
  GENOME_COMPARISONS = "GENOME_COMPARISONS",
  PROTEIN_FOLDING = "PROTEIN_FOLDING",
  REGULATION = "REGULATION",
  TRANSCRIPTOMICS = "TRANSCRIPTOMICS",
  VARIANT_CALLING = "VARIANT_CALLING",
}

export type BRCCatalog = BRCDataCatalogGenome;

export interface BRCDataCatalogGenome {
  chromosomes: number;
  contigs: number;
  genomeVersionAssemblyId: string;
  ncbiTaxonomyId: string;
  organism: string;
  species: string;
  strain: string;
  supercontigs: number;
  ucscBrowserUrl: string;
  vEuPathDbProject: string;
}

export interface EntitiesResponse<R> {
  hits: R[];
  pagination: EntitiesResponsePagination;
  termFacets: Record<never, never>;
}

export interface EntitiesResponsePagination {
  count: number;
  pages: number;
  size: number;
  total: number;
}
