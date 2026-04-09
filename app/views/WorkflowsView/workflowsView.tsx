import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { JSX, useEffect, useMemo, useState } from "react";
import {
  getOrganisms,
  getWorkflows as getWorkflowCategories,
} from "../../../app/services/workflows/entities";
import { WorkflowAssemblyMapping } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { API } from "../../services/workflows/routes";
import { ExploreView } from "../ExploreView/exploreView";
import { Workflows } from "./components/Workflows/workflows";
import { getWorkflows } from "./utils";
import { Organism } from "./types";

/**
 * WorkflowsView renders the main view for exploring workflows,
 * utilizing the ExploreView component to provide filtering and layout.
 * @returns Workflows view.
 */
export const WorkflowsView = (): JSX.Element => {
  const workflowCategories = getWorkflowCategories();
  const organisms = getOrganisms<Organism>();
  const isLmlsEnabled = useFeatureFlag("lmls");
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
        ? getWorkflows(workflowCategories, mappings, organisms, isLmlsEnabled)
        : [],
    [isLmlsEnabled, mappings, organisms, workflowCategories]
  );

  return <ExploreView data={workflows} Component={Workflows} />;
};
