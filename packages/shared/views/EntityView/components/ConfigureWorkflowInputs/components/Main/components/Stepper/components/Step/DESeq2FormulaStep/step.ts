import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { DESeq2FormulaStep } from "./deSeq2FormulaStep";

export const STEP = {
  Step: DESeq2FormulaStep,
  key: "designFormula",
  label: "Specify DESeq2 Formula",
} satisfies StepConfig;
