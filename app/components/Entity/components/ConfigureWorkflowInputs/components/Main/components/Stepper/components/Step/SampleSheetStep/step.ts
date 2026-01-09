import { StepConfig } from "../types";
import { SampleSheetStep } from "./sampleSheetStep";

export const STEP = {
  Step: SampleSheetStep,
  key: "sampleSheet",
  label: "Upload a samplesheet",
} satisfies StepConfig;
