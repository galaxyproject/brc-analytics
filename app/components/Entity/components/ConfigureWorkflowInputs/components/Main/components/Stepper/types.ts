import { Workflow } from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  Status,
  OnLaunchGalaxy,
} from "./components/Step/hooks/UseLaunchGalaxy/types";
import { StepConfig } from "./components/Step/types";
import { ConfiguredInput } from "../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Assembly } from "../../../../../../../../views/WorkflowInputsView/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  genome: Assembly;
  onConfigure: OnConfigure;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  workflow: Workflow;
}
