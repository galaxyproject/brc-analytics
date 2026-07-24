export const GALAXY_DATACACHE = "Galaxy Data Cache";
export const GENOME_BROWSER = "UCSC Genome Browser";
export const NCBI_ASSEMBLY = "NCBI Genome Assembly";
export const NCBI_TAXONOMY = "NCBI Taxonomy";
export const NCBI_DATASETS_URL = "https://www.ncbi.nlm.nih.gov/datasets";

/**
 * Display labels for the shared entity-detail key-value panels. Kept
 * site-neutral so the shared detail builders don't depend on a site's category
 * configuration; each site's own category labels stay independent of these.
 */
export const ENTITY_DETAIL_LABEL = {
  ACCESSION: "Accession",
  TAXONOMIC_LEVEL_ISOLATE: "Isolate",
  TAXONOMIC_LEVEL_SEROTYPE: "Serotype",
  TAXONOMIC_LEVEL_SPECIES: "Species",
  TAXONOMIC_LEVEL_STRAIN: "Strain",
} as const;

/**
 * Species-cell tag labels. Single source of truth shared by the tag builders
 * and the organism-scoped filter so they can't drift apart.
 */
export const SPECIES_TAG_LABEL = {
  GROUP: "group",
  PRIORITY: "priority",
} as const;

/**
 * Labels of the species/organism-scoped tags (constant across an organism's
 * assemblies). On the organism detail page these move to the header, so the
 * per-assembly species cell omits them.
 */
export const ORGANISM_SCOPED_TAG_LABELS: readonly string[] = [
  SPECIES_TAG_LABEL.GROUP,
  SPECIES_TAG_LABEL.PRIORITY,
];
