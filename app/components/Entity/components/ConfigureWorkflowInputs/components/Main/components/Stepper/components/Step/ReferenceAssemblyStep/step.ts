import { StepConfig } from "../types";
import { ReferenceAssemblyStep } from "./referenceAssemblyStep";

export const STEP: StepConfig = {
  Step: ReferenceAssemblyStep,
  disabled: true,
  label: "Reference Assembly",
  renderValue({ referenceAssembly }) {
    return referenceAssembly;
  },
};
