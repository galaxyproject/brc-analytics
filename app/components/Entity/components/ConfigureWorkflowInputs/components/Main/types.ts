import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepConfig } from "./components/Stepper/components/Step/types";
import { Assembly } from "../../../../../../views/WorkflowInputsView/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  genome: Assembly;
  onConfigure: OnConfigure;
  workflow: Workflow;
}
