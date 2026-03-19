import { StepConfig } from "../types";
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
