import type { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import type { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  organism?: Organism;
  workflow: Workflow;
}
