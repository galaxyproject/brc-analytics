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
