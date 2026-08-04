import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SampleSheetStep } from "./sampleSheetStep";

export const STEP = {
  Step: SampleSheetStep,
  key: "sampleSheet",
  label: "Upload a Sample Sheet",
} satisfies StepConfig;
