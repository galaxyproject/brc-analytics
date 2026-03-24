import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";
import { Accordion } from "./components/Accordion/accordion";
import { Props } from "./types";
import { buildAssemblyWorkflows } from "./utils";

/**
 * Main component for the AnalyzeWorkflowsView, which displays compatible workflows for a given assembly.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @param props.entityId - Entity ID.
 * @returns A JSX element representing the main content of the AnalyzeWorkflowsView.
 */
export const Main = ({ assembly, entityId }: Props): JSX.Element => {
  const workflowCategories = buildAssemblyWorkflows(
    assembly,
    WORKFLOW_CATEGORIES
  );
  return (
    <BackPageContentMainColumn>
      {workflowCategories.map((workflowCategory) => {
        return (
          <Accordion
            disabled={workflowCategory.workflows.length === 0}
            entityId={entityId as string}
            geneModelUrl={assembly.geneModelUrl}
            genomeVersionAssemblyId={assembly.accession}
            key={workflowCategory.category}
            workflowCategory={workflowCategory}
            workflows={workflowCategory.workflows}
          />
        );
      })}
    </BackPageContentMainColumn>
  );
};
