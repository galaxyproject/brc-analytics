import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { PrimaryContrastsStep } from "./primaryContrastsStep";

export const STEP = {
  Step: PrimaryContrastsStep,
  key: "primaryContrasts",
  label: "Define Primary Contrasts",
} satisfies StepConfig;
