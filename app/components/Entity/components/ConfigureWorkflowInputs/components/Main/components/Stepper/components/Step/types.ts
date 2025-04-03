import { ComponentType, ReactNode } from "react";
import { StepProps as MStepProps } from "@mui/material";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  ConfiguredValue,
  LaunchStatus,
  OnLaunch,
} from "./hooks/UseLaunchGalaxy/types";
import { OnStep } from "../../hooks/UseStepper/types";

export interface StepConfig {
  description?: ReactNode;
  disabled?: boolean;
  key: keyof ConfiguredValue;
  label: string;
  Step: ComponentType<StepProps>;
}

export interface StepProps
  extends Omit<StepConfig, "Step" | "key" | "label">,
    Pick<MStepProps, "active" | "completed" | "index" | "last"> {
  entryKey: keyof ConfiguredValue;
  entryLabel: string;
  genome: BRCDataCatalogGenome;
  launchStatus: LaunchStatus;
  onConfigure: OnConfigure;
  onLaunch: OnLaunch;
  onStep: OnStep;
  workflow: Workflow;
}
