import {
  ConfiguredInput,
  OnConfigure,
} from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  OnLaunchGalaxy,
  Status,
} from "./components/Step/hooks/UseLaunchGalaxy/types";
import { StepConfig } from "./components/Step/types";
import { OnContinue, OnEdit } from "./hooks/UseStepper/types";

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
