import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useWorkflowEntity } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { type JSX } from "react";
import { SequencingStepContent } from "./components/SequencingStepContent/sequencingStepContent";

/**
 * Sequencing step for workflow configuration. Its read-run table, taxonomy-match
 * snapshot and accession results all belong to one taxon, so the step's content
 * is keyed by the workflow entity's taxon: picking an organism or reference
 * assembly with a different taxon starts it afresh rather than carrying the
 * previous taxon's state over.
 * @param props - Step props.
 * @returns Sequencing step.
 */
export const SequencingStep = (props: StepProps): JSX.Element => {
  const { ncbiTaxonomyId } = useWorkflowEntity() ?? {};
  return <SequencingStepContent key={ncbiTaxonomyId} {...props} />;
};
