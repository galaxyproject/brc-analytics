import React, { JSX, useMemo } from "react";
import { ExploreView } from "../ExploreView/exploreView";
import { Workflows } from "./components/Workflows/workflows";
import { getWorkflows as getWorkflowCategories } from "../../../app/services/workflows/entities";
import { getWorkflows } from "./utils";

/**
 * WorkflowsView renders the main view for exploring workflows,
 * utilizing the ExploreView component to provide filtering and layout.
 * @returns Workflows view.
 */
export const WorkflowsView = (): JSX.Element => {
  const workflowCategories = getWorkflowCategories();

  const workflows = useMemo(
    () => getWorkflows(workflowCategories),
    [workflowCategories]
  );

  return <ExploreView data={workflows} Component={Workflows} />;
};
