import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { StepConfig } from "../../../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { ConfiguredInput } from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  workflow: Workflow;
}
