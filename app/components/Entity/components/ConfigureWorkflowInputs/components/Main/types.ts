import {
  ConfiguredInput,
  OnConfigure,
} from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { Workflow } from "@repo/shared/apis/workflow";
import { StepConfig } from "./components/Stepper/components/Step/types";
import {
  OnContinue,
  OnEdit,
} from "./components/Stepper/hooks/UseStepper/types";

export interface Props {
  activeStep: number;
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  workflow: Workflow;
}
