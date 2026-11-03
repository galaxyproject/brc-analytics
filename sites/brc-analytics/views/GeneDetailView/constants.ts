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
