import { type OrganismContract } from "@repo/shared/apis/types";
import type { WorkflowAssemblyMapping } from "@repo/shared/apis/workflow";
import { useWorkflowFeatureFlags } from "@repo/shared/hooks/UseWorkflowFeatureFlags/hook";
import {
  getOrganisms,
  getWorkflows as getWorkflowCategories,
} from "@repo/shared/services/workflows/entities";
import { API } from "@repo/shared/services/workflows/routes";
import { ExploreView } from "@repo/shared/views/ExploreView/exploreView";
import { type JSX, useEffect, useMemo, useState } from "react";
import { Workflows } from "./components/Workflows/workflows";
import { getWorkflows } from "./utils";

/**
 * WorkflowsView renders the main view for exploring workflows,
 * utilizing the ExploreView component to provide filtering and layout.
 * @returns Workflows view.
 */
export const WorkflowsView = (): JSX.Element => {
  const workflowCategories = getWorkflowCategories();
  const organisms = getOrganisms<OrganismContract>();
  const workflowGates = useWorkflowFeatureFlags();
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
    () =>
      mappings
        ? getWorkflows(workflowCategories, mappings, organisms, workflowGates)
        : [],
    [mappings, organisms, workflowCategories, workflowGates]
  );

  return <ExploreView data={workflows} Component={Workflows} />;
};
