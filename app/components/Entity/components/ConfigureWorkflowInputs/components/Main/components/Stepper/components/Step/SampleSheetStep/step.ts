import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SampleSheetStep } from "./sampleSheetStep";

export const STEP = {
  Step: SampleSheetStep,
  key: "sampleSheet",
  label: "Upload a Sample Sheet",
} satisfies StepConfig;
