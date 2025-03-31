import { StepConfig } from "../types";
import { ReferenceAssemblyStep } from "./referenceAssemblyStep";

export const STEP: StepConfig = {
  Step: ReferenceAssemblyStep,
  disabled: true,
  key: "reference-assembly",
  label: "Reference Assembly",
};
