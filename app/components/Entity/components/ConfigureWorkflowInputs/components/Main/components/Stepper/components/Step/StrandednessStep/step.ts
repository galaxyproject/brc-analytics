import { getStepLabel } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/StrandednessStep/utils";
import { StepConfig } from "../types";
import { StrandednessStep } from "./strandednessStep";

export const STEP = {
  Step: StrandednessStep,
  key: "strandedness",
  label: "Specify Strandedness",
  renderValue({ strandedness }): string {
    return getStepLabel(strandedness);
  },
} satisfies StepConfig;
