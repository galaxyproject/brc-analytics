import { ComponentType, ReactNode } from "react";
import { StepProps as MStepProps } from "@mui/material";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Status, OnLaunchGalaxy } from "./hooks/UseLaunchGalaxy/types";
import { OnContinue, OnEdit } from "../../hooks/UseStepper/types";

export interface StepConfig {
  description?: ReactNode;
  disabled?: boolean;
  label: string;
  renderValue: (ci: ConfiguredInput) => string | undefined;
  Step: ComponentType<StepProps>;
}

export interface StepProps
  extends Omit<StepConfig, "Step" | "key" | "label">,
    Pick<MStepProps, "active" | "completed" | "last">,
    Required<Pick<MStepProps, "index">> {
  entryLabel: string;
  genome: BRCDataCatalogGenome;
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  workflow: Workflow;
}
