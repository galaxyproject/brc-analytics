import { StepConfig } from "../types";
import { SequenceStep } from "./sequenceStep";

export const STEP = {
  Step: SequenceStep,
  key: "sequence",
  label: "Sequence",
  renderValue({ sequenceFileName }): string | undefined {
    return sequenceFileName;
  },
} satisfies StepConfig;
