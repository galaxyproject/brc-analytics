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
  geneModelUrl: string;
  genomeVersionAssemblyId: string;
  ncbiTaxonomyId: string;
  organism: string;
  species: string;
  strain: string;
  supercontigs: number;
  ucscBrowserUrl: string;
  vEuPathDBProject: string;
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

export enum WORKFLOW_ID {
  REGULATION = "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/chipseq-pe/main/versions/v0.12",
  TRANSCRIPTOMICS = "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/rnaseq-pe/main/versions/v0.9",
  VARIANT_CALLING = "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/haploid-variant-calling-wgs-pe/main/versions/v0.1",
}
