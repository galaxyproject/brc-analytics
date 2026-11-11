import { type Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "@repo/shared/routes/constants";

// The gene page's breadcrumbs lead with the genes page, as the organism and
// assembly pages lead with theirs; a loaded gene adds its own.
export const GENE_BREADCRUMBS: Breadcrumb[] = [
  { path: ROUTES.GENES, text: "Genes" },
];

// The alias type of a gene's NCBI GeneID, as the gene API names it.
export const NCBI_GENE_ID_ALIAS_TYPE = "ncbi_gene_id";

// NCBI Gene's address for a gene, before its GeneID.
export const NCBI_GENE_URL = "https://www.ncbi.nlm.nih.gov/gene";

// Display names for the gene types NCBI writes in a GFF3's `gene_biotype`:
// every value NCBI's writer can give (sGetFeatureGeneBiotypeWrapper in
// ncbi-cxx-toolkit-public's src/objmgr/util/feature.cpp, at the commit the
// gene reading spec pins). Names already readable as written, such as "tRNA",
// map to themselves. A value not listed is shown as written.
export const GENE_TYPE_NAMES: Record<string, string> = {
  C_region: "C region",
  C_region_pseudogene: "C region pseudogene",
  D_segment: "D segment",
  D_segment_pseudogene: "D segment pseudogene",
  J_segment: "J segment",
  J_segment_pseudogene: "J segment pseudogene",
  RNase_MRP_RNA: "RNase MRP RNA",
  RNase_P_RNA: "RNase P RNA",
  SRP_RNA: "SRP RNA",
  V_region: "V region",
  V_region_pseudogene: "V region pseudogene",
  V_segment: "V segment",
  V_segment_pseudogene: "V segment pseudogene",
  Y_RNA: "Y RNA",
  antisense_RNA: "Antisense RNA",
  autocatalytically_spliced_intron: "Autocatalytically spliced intron",
  guide_RNA: "Guide RNA",
  hammerhead_ribozyme: "Hammerhead ribozyme",
  lncRNA: "lncRNA",
  miRNA: "miRNA",
  misc_RNA: "Miscellaneous RNA",
  ncRNA: "ncRNA",
  ncRNA_pseudogene: "ncRNA pseudogene",
  other: "Other",
  piRNA: "piRNA",
  protein_coding: "Protein-coding",
  pseudogene: "Pseudogene",
  rRNA: "rRNA",
  rRNA_pseudogene: "rRNA pseudogene",
  rasiRNA: "rasiRNA",
  ribozyme: "Ribozyme",
  scRNA: "scRNA",
  segment: "Segment",
  segment_pseudogene: "Segment pseudogene",
  siRNA: "siRNA",
  snRNA: "snRNA",
  snRNA_pseudogene: "snRNA pseudogene",
  snoRNA: "snoRNA",
  snoRNA_pseudogene: "snoRNA pseudogene",
  stRNA: "stRNA",
  tRNA: "tRNA",
  tRNA_pseudogene: "tRNA pseudogene",
  telomerase_RNA: "Telomerase RNA",
  tmRNA: "tmRNA",
  tmRNA_pseudogene: "tmRNA pseudogene",
  transcribed_pseudogene: "Transcribed pseudogene",
  vault_RNA: "Vault RNA",
};
