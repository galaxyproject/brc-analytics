import { ROUTES } from "@brc-analytics/core/routes/constants";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Props } from "./types";

/**
 * Returns breadcrumbs for the AnalyzeView component.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns Breadcrumbs.
 */
export function getBreadcrumbs({ assembly }: Props): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    { path: "", text: assembly.accession },
    { path: "", text: "Analyze in Galaxy" },
  ];
}
