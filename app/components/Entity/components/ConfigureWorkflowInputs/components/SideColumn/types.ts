import type { Workflow } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import type { Organism } from "@/views/OrganismView/types";
import type { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  organism?: Organism;
  workflow: Workflow;
}
