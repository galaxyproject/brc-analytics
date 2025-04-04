import { StepConfig } from "../types";
import { PairedEndStep } from "./pairedEndStep";

export const STEP: StepConfig = {
  Step: PairedEndStep,
  disabled: false,
  key: "readRuns",
  label: "Paired-End Sequencing Data",
};
