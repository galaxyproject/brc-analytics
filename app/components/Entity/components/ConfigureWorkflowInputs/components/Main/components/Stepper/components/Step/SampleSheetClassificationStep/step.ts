import { StepConfig } from "../types";
import { SampleSheetClassificationStep } from "./sampleSheetClassificationStep";

export const STEP = {
  Step: SampleSheetClassificationStep,
  key: "sampleSheetClassification",
  label: "Classify the Sample Sheet Columns",
} satisfies StepConfig;
