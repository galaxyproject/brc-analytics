import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { StrandednessStep } from "./strandednessStep";
import { getStepLabel } from "./utils";

export const STEP = {
  Step: StrandednessStep,
  key: "strandedness",
  label: "Specify Strandedness",
  renderValue({ strandedness }): string {
    return getStepLabel(strandedness);
  },
} satisfies StepConfig;
