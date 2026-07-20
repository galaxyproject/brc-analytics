import {
  ConfiguredInput,
  OnConfigure,
} from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";
import {
  OnContinue,
  OnEdit,
} from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/types";
import { StepConfig } from "./components/Stepper/components/Step/types";

export interface Props {
  activeStep: number;
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  workflow: Workflow;
}
