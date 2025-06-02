import { StepConfig } from "../types";
import { ReferenceAssemblyStep } from "./referenceAssemblyStep";

export const STEP = {
  Step: ReferenceAssemblyStep,
  disabled: true,
  key: "referenceAssembly",
  label: "Reference Assembly",
  renderValue({ referenceAssembly }): string | undefined {
    return referenceAssembly;
  },
} satisfies StepConfig;
