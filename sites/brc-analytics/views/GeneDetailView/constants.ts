import { type Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "@repo/shared/routes/constants";

// The gene page's breadcrumbs lead with the genes page, as the organism and
// assembly pages lead with theirs; a loaded gene adds its own.
export const GENE_BREADCRUMBS: Breadcrumb[] = [
  { path: ROUTES.GENES, text: "Genes" },
];
