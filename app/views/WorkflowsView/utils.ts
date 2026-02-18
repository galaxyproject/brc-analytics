import { Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { WorkflowEntity } from "../../../site-config/brc-analytics/local/index/workflow/types";
import { WorkflowCategory } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { ROUTES } from "routes/constants";

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Each workflow includes the properties of the workflow itself along with the name of its category.
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[]
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      workflows.push({
        ...workflow,
        category: category.name,
        disabled: category.showComingSoon === false,
        taxonomyId: workflow.taxonomyId ?? "Unspecified",
      });
    }
  }

  return workflows;
}

/**
 * Utility function to filter out the workflows navigation item from the header navigation based on the feature flag.
 * If the workflows feature is enabled, the original navigation is returned. Otherwise, the navigation is filtered to exclude the workflows item.
 * @param configuredNavigation - The original header navigation structure.
 * @param isWorkflowsEnabled - A boolean indicating whether the workflows feature is enabled.
 * @returns The filtered navigation structure based on the workflows feature flag.
 */
export function filterWorkflowsFromNavigation(
  configuredNavigation: Navigation | undefined,
  isWorkflowsEnabled: boolean
): Navigation | undefined {
  if (isWorkflowsEnabled) return configuredNavigation;

  return configuredNavigation?.reduce(
    (acc, navigation, i) => {
      if (!navigation) return acc;

      const filteredNav = navigation.filter(
        ({ url }) => url !== ROUTES.WORKFLOWS
      );

      if (filteredNav.length > 0) (acc ?? [])[i] = filteredNav;

      return acc;
    },
    [undefined, undefined, undefined] as Navigation
  );
}
