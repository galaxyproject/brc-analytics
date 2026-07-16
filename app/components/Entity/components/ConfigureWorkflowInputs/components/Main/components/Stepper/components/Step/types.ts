import { Workflow } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  OnContinue,
  OnEdit,
} from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/types";
import { StepProps as MStepProps } from "@mui/material";
import { ComponentType, ReactNode } from "react";
import { OnLaunchGalaxy, Status } from "./hooks/UseLaunchGalaxy/types";

export interface StepConfig {
  description?: ReactNode;
  disabled?: boolean;
  hasSidePanel?: boolean;
  key: keyof ConfiguredInput | "readRunsAny" | "sampleSheet";
  label: string;
  renderValue?: (ci: ConfiguredInput) => string | undefined;
  Step: ComponentType<StepProps>;
}

export interface StepProps
  extends
    Pick<StepConfig, "description" | "disabled">,
    Pick<MStepProps, "completed" | "last">,
    Required<Pick<MStepProps, "index" | "active">> {
  configuredInput: ConfiguredInput;
  entryLabel: string;
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  stepKey: keyof ConfiguredInput | "readRunsAny" | "sampleSheet";
  workflow: Workflow;
}
