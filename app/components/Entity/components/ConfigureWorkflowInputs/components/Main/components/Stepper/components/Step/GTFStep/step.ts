import { StepConfig } from "../types";
import { GTFStep } from "./gtfStep";

export const STEP: StepConfig = {
  Step: GTFStep,
  description: "Select the GTF files for the workflow",
  key: "gtf-files",
  label: "GTF Files",
};
