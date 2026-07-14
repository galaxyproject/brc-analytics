/**
 * A pangenome bundle for a species, served from pangenomes.json and consumed by
 * the organism-page Pangenome section. Fetched through the entity store like
 * organisms/assemblies (see services/workflows). MOCK-backed until the real
 * pangenomes.json build lands (#1341).
 */
export interface Pangenome {
  bundleId: string;
  members: PangenomeMember[];
  speciesTaxonomyId: string;
  version: string;
}

/**
 * A member assembly of a pangenome bundle. Display-ready values (level, length,
 * etc.); the real build will derive these by joining member accessions against
 * the assemblies catalog.
 */
export interface PangenomeMember {
  accession: string;
  hasSelectionTracks: boolean;
  isAnchor: boolean;
  isRef: boolean;
  length: string;
  levelFilledCount: number;
  levelLabel: string;
  name: string;
  ucscBrowserUrl: string;
}
