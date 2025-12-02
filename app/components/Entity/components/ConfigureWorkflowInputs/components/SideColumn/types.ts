import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepConfig } from "../../../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { Assembly } from "../../../../../../views/WorkflowInputsView/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  genome: Assembly;
  workflow: Workflow;
}
