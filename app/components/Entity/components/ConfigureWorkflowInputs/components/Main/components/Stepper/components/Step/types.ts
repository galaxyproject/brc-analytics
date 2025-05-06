import { ComponentType, ReactNode } from "react";
import { StepProps as MStepProps } from "@mui/material";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  ConfiguredValue,
  Status,
  OnLaunchGalaxy,
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
  onConfigure: OnConfigure;
  onLaunchGalaxy: OnLaunchGalaxy;
  onStep: OnStep;
  status: Status;
  workflow: Workflow;
}
