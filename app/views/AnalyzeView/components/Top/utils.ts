import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "../../../../../routes/constants";
import { Assembly } from "../../../WorkflowInputsView/types";

/**
 * Get the assembly breadcrumbs.
 * @param assembly - Assembly entity.
 * @returns Breadcrumbs.
 */
export function getBreadcrumbs(assembly: Assembly): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    { path: "", text: assembly.accession },
    { path: "", text: "Analyze in Galaxy" },
  ];
}
