import { StepConfig } from "../types";
import { PairedEndStep } from "./pairedEndStep";

export const STEP: StepConfig = {
  Step: PairedEndStep,
  disabled: false,
  key: "pairedEnd",
  label: "Paired-End Sequencing Data",
};
