import { Workflow } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  OnContinue,
  OnEdit,
} from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/types";
import {
  OnLaunchGalaxy,
  Status,
} from "./components/Step/hooks/UseLaunchGalaxy/types";
import { StepConfig } from "./components/Step/types";

export interface Props {
  activeStep: number;
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  workflow: Workflow;
}
