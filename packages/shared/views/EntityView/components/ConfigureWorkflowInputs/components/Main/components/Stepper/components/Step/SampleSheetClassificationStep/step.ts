import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SampleSheetClassificationStep } from "./sampleSheetClassificationStep";

export const STEP = {
  Step: SampleSheetClassificationStep,
  hasSidePanel: true,
  key: "sampleSheetClassification",
  label: "Classify the Sample Sheet Columns",
} satisfies StepConfig;
