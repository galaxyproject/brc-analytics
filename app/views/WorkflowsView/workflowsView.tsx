import React, { JSX, useEffect, useMemo, useState } from "react";
import { ExploreView } from "../ExploreView/exploreView";
import { Workflows } from "./components/Workflows/workflows";
import { getWorkflows as getWorkflowCategories } from "../../../app/services/workflows/entities";
import { WorkflowAssemblyMapping } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { API } from "../../services/workflows/routes";
import { getWorkflows } from "./utils";

/**
 * WorkflowsView renders the main view for exploring workflows,
 * utilizing the ExploreView component to provide filtering and layout.
 * @returns Workflows view.
 */
export const WorkflowsView = (): JSX.Element => {
  const workflowCategories = getWorkflowCategories();
  const [mappings, setMappings] = useState<WorkflowAssemblyMapping[] | null>(
    null
  );

  useEffect(() => {
    fetch(API.workflowAssemblyMappings)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch: ${API.workflowAssemblyMappings}`);
        return res.json();
      })
      .then((data: WorkflowAssemblyMapping[]) => setMappings(data))
      .catch((error) =>
        console.error("Failed to load workflow-assembly mappings:", error)
      );
  }, []);

  const workflows = useMemo(
    () => (mappings ? getWorkflows(workflowCategories, mappings) : []),
    [workflowCategories, mappings]
  );

  return <ExploreView data={workflows} Component={Workflows} />;
};
