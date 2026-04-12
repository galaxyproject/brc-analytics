import { StepProps as MStepProps } from "@mui/material";
import { ComponentType, ReactNode } from "react";
import { Workflow } from "../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Assembly } from "../../../../../../../../../../views/WorkflowInputsView/types";
import { OnContinue, OnEdit } from "../../hooks/UseStepper/types";
import { OnLaunchGalaxy, Status } from "./hooks/UseLaunchGalaxy/types";
import { VIEW } from "./SequencingStep/components/ToggleButtonGroup/types";

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
  genome?: Assembly;
  initialDataSourceView?: VIEW;
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  stepKey: keyof ConfiguredInput | "readRunsAny" | "sampleSheet";
  workflow: Workflow;
}
