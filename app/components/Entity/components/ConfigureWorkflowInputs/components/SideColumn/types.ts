import type { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import type { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  organism?: OrganismContract;
  workflow: Workflow;
}
