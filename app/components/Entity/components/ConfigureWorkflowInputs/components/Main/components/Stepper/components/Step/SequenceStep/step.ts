import { type StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SequenceStep } from "./sequenceStep";

export const STEP = {
  Step: SequenceStep,
  key: "sequence",
  label: "Sequence",
  renderValue({ sequenceFileName }): string | undefined {
    return sequenceFileName;
  },
} satisfies StepConfig;
