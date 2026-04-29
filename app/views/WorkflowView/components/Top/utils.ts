import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { ROUTES } from "../../../../../routes/constants";
import { Props } from "./types";

/**
 * Returns breadcrumbs for the workflow view.
 * @param props - The props for the workflow view.
 * @param props.workflow - Workflow.
 * @returns Breadcrumbs for the workflow view.
 */
export function getBreadcrumbs({ workflow }: Props): Breadcrumb[] {
  return [
    {
      path: ROUTES.WORKFLOWS,
      text: "Analyze",
    },
    { path: "", text: workflow.workflowName },
    { path: "", text: "Configure Inputs" },
  ];
}
