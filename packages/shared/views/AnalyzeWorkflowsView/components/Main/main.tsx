import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { WorkflowCategory } from "@repo/shared/components/workflow/WorkflowCategory/workflowCategory";
import { useWorkflowFeatureFlags } from "@repo/shared/hooks/UseWorkflowFeatureFlags/hook";
import { getWorkflows } from "@repo/shared/services/workflows/entities";
import { type JSX } from "react";
import { type Props } from "./types";
import { buildAssemblyWorkflows } from "./utils";

/**
 * Main component for the AnalyzeWorkflowsView, which displays compatible workflows for a given assembly.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @param props.entityId - Entity ID.
 * @returns A JSX element representing the main content of the AnalyzeWorkflowsView.
 */
export const Main = ({ assembly, entityId }: Props): JSX.Element => {
  const workflowGates = useWorkflowFeatureFlags();
  const workflowCategories = buildAssemblyWorkflows(
    assembly,
    getWorkflows(),
    workflowGates
  );
  return (
    <BackPageContentMainColumn>
      {workflowCategories.map((workflowCategory) => {
        return (
          <WorkflowCategory
            disabled={workflowCategory.workflows.length === 0}
            entityId={entityId as string}
            key={workflowCategory.category}
            workflowCategory={workflowCategory}
            workflows={workflowCategory.workflows}
          />
        );
      })}
    </BackPageContentMainColumn>
  );
};
