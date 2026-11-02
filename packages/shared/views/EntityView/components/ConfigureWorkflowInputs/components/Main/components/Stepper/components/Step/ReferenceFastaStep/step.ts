import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { ReferenceFastaStep } from "./referenceFastaStep";

export const STEP = {
  Step: ReferenceFastaStep,
  key: "referenceAssembly",
  label: "Reference Assembly",
  renderValue({ referenceAssembly }): string | undefined {
    return referenceAssembly;
  },
} satisfies StepConfig;
