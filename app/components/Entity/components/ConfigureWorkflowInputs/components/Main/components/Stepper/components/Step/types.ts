import { ComponentType, ReactNode } from "react";
import { StepProps as MStepProps } from "@mui/material";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface StepConfig {
  description?: ReactNode;
  disabled?: boolean;
  key: string;
  label: string;
  Step: ComponentType<StepProps>;
}

export interface StepProps
  extends Omit<StepConfig, "Step" | "key">,
    Pick<MStepProps, "active" | "completed" | "index" | "last"> {
  configKey: string;
  genome: BRCDataCatalogGenome;
  onConfigure: OnConfigure;
  workflow: Workflow;
}
