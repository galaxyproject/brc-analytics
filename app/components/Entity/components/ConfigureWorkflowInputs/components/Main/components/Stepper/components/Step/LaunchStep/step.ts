import { StepConfig } from "../types";
import { LaunchStep } from "./launchStep";

export const STEP = {
  Step: LaunchStep,
  key: "referenceAssembly", // Reuse an existing key but won't actually configure anything
  label: "Launch Workflow",
  renderValue(): string | undefined {
    return undefined;
  },
} satisfies StepConfig;
