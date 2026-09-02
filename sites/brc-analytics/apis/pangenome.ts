/**
 * A pangenome bundle for a species, read from the pangenomes catalog at build
 * time and embedded in the organism page's static props for the Pangenome
 * section. MOCK-backed until the real pangenomes catalog build lands (#1341).
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
